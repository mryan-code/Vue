<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";
// import draggable from "vuedraggable";
import { VueDraggable as draggable } from "vue-draggable-plus";
// Deprecated: node-canvas is a Node native binding. Puzzle tiles are sliced with the browser HTML5 canvas instead.
// import { createCanvas, loadImage } from "canvas";

const API = new APIClass();
const appStore = useAppStore();

const picturePuzzleGridSize = ref(3);
const picturePuzzleGridSizeOptions = [3, 6, 9];
const picturePuzzleImageOption = ref(1);
const picturePuzzleImageOptions = ref<types.KeyValue[]>([]);
const picturePuzzleGrid = ref<types.KeyValue[]>([]);

const picturePuzzleImage = ref<File | null>(null);
const picturePuzzleCanvas = ref<HTMLCanvasElement | null>(null);
const picturePuzzleCanvasWidth = ref(0);
const picturePuzzleCanvasHeight = ref(0);
const element = ref<HTMLElement | null>(null);
const picturePuzzleEmptySpot = ref({ x: 0, y: 0, col: 0, row: 0 });
const picturePuzzleDragLock = ref<{
	axis: "x" | "y";
	min_translate: number;
	max_translate: number;
} | null>(null);

const base64ToBytes = (value: string): Uint8Array => {
	const cleaned = value.replace(/\s/g, "");
	const binary = atob(cleaned);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};
const bytesLookLikeImage = (bytes: Uint8Array): boolean => {
	if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
		return true;
	}
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return true;
	}
	if (bytes.length >= 6) {
		const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
		if (header === "GIF87a" || header === "GIF89a") {
			return true;
		}
	}
	if (
		bytes.length >= 12 &&
		String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
		String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
	) {
		return true;
	}
	return false;
};
const puzzleImageBytes = (blobValue: unknown): Uint8Array | null => {
	let bytes: Uint8Array | null = null;
	if (typeof blobValue === "string") {
		const raw = blobValue.includes(",") ? blobValue.split(",")[1] || "" : blobValue;
		if (!raw.replace(/\s/g, "")) {
			return null;
		}
		bytes = base64ToBytes(raw);
	} else if (blobValue && typeof blobValue === "object" && Array.isArray((blobValue as { data?: number[] }).data)) {
		bytes = new Uint8Array((blobValue as { data: number[] }).data);
	}
	if (!bytes) {
		return null;
	}
	if (bytesLookLikeImage(bytes)) {
		return bytes;
	}
	const asText = new TextDecoder("utf-8").decode(bytes).replace(/\s/g, "");
	if (/^[A-Za-z0-9+/]+=*$/.test(asText)) {
		const innerBytes = base64ToBytes(asText);
		if (bytesLookLikeImage(innerBytes)) {
			return innerBytes;
		}
	}
	return bytes;
};
const loadPuzzleImage = (bytes: Uint8Array, mimeType: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
		const blob = new Blob([arrayBuffer as ArrayBuffer], { type: mimeType });
		const objectUrl = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Failed to load the puzzle image"));
		};
		img.src = objectUrl;
	});
};

// Keep CSS values out of the template so nested quotes cannot break Vue's attribute parser.
const picturePuzzlePieceStyle = (piece: types.KeyValue) => {
	return {
		left: (piece.x as number) + "px",
		top: (piece.y as number) + "px",
		width: (piece.width as number) + "px",
		height: (piece.height as number) + "px",
		backgroundImage: "url(" + (piece.blobUrl as string) + ")",
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		cursor: piece.can_slide === true ? (piece.slide_axis === "x" ? "ew-resize" : "ns-resize") : "default",
	};
};

// Orthogonal neighbors of the hole (2 on a corner, 3 on an edge, 4 in the center) may slide.
const picturePuzzlePieceTouchesEmpty = (piece: types.KeyValue): boolean => {
	const emptyCol = picturePuzzleEmptySpot.value.col;
	const emptyRow = picturePuzzleEmptySpot.value.row;
	const col = piece.col as number;
	const row = piece.row as number;
	return Math.abs(col - emptyCol) + Math.abs(row - emptyRow) === 1;
};
const updatePicturePuzzleDragState = () => {
	for (const piece of picturePuzzleGrid.value) {
		piece.can_slide = picturePuzzlePieceTouchesEmpty(piece);
		// Same row slides on x toward the hole; same column slides on y.
		piece.slide_axis =
			piece.can_slide === true ? ((piece.row as number) === picturePuzzleEmptySpot.value.row ? "x" : "y") : "";
	}
};

const constrainPicturePuzzleFallback = () => {
	const lock = picturePuzzleDragLock.value;
	if (!lock) {
		return;
	}
	const fallback = document.querySelector(".sortable-fallback") as HTMLElement | null;
	if (!fallback) {
		return;
	}
	const matrix = new DOMMatrix(getComputedStyle(fallback).transform);
	let translateX = matrix.e;
	let translateY = matrix.f;
	if (lock.axis === "x") {
		translateX = Math.min(lock.max_translate, Math.max(lock.min_translate, translateX));
		translateY = 0;
	} else {
		translateY = Math.min(lock.max_translate, Math.max(lock.min_translate, translateY));
		translateX = 0;
	}
	const next = "matrix(1, 0, 0, 1, " + translateX + ", " + translateY + ")";
	fallback.style.transform = next;
	fallback.style.webkitTransform = next;
};

const startPicturePuzzleAxisLock = (event: Event) => {
	const item = (event as Event & { item?: HTMLElement }).item;
	const pieceId = Number(item?.dataset?.pieceId);
	const piece = picturePuzzleGrid.value.find((entry) => entry.piece_id === pieceId);
	if (!piece || piece.can_slide !== true) {
		return;
	}
	const empty = picturePuzzleEmptySpot.value;
	const axis = (piece.row as number) === empty.row ? "x" : "y";
	const start = axis === "x" ? (piece.x as number) : (piece.y as number);
	const hole = axis === "x" ? empty.x : empty.y;
	const delta = hole - start;
	picturePuzzleDragLock.value = {
		axis: axis,
		min_translate: Math.min(0, delta),
		max_translate: Math.max(0, delta),
	};
	document.addEventListener("pointermove", constrainPicturePuzzleFallback);
	document.addEventListener("mousemove", constrainPicturePuzzleFallback);
	document.addEventListener("touchmove", constrainPicturePuzzleFallback);
};

const stopPicturePuzzleAxisLock = () => {
	picturePuzzleDragLock.value = null;
	document.removeEventListener("pointermove", constrainPicturePuzzleFallback);
	document.removeEventListener("mousemove", constrainPicturePuzzleFallback);
	document.removeEventListener("touchmove", constrainPicturePuzzleFallback);
};

const displayPicturePuzzle = async () => {
	const shuffleArray = (array: types.KeyValue[]) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	};

	let imageTemp: types.KeyValue | null = picturePuzzleImageOptions.value[picturePuzzleImageOption.value - 1];

	picturePuzzleGrid.value = [];
	if (!imageTemp) {
		return;
	}

	const sourceBytes = puzzleImageBytes(imageTemp.blob);
	if (!sourceBytes) {
		return;
	}
	const sourceMimeType =
		typeof imageTemp.mime_type === "string" && imageTemp.mime_type ? imageTemp.mime_type : "image/png";
	const loadMimeType = sourceMimeType === "image/jpg" ? "image/jpeg" : sourceMimeType;
	const mimeType: "image/png" | "image/jpeg" = loadMimeType === "image/jpeg" ? "image/jpeg" : "image/png";
	await nextTick();
	const canvas = picturePuzzleCanvas.value;
	if (!canvas) {
		return;
	}
	const sourceImage = await loadPuzzleImage(sourceBytes, loadMimeType);
	const pieceWidth = Math.max(1, Math.round(sourceImage.width / picturePuzzleGridSize.value));
	const pieceHeight = Math.max(1, Math.round(sourceImage.height / picturePuzzleGridSize.value));
	const canvasWidth = Math.max(1, Math.round(pieceWidth));
	const canvasHeight = Math.max(1, Math.round(pieceHeight));
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}
	let pieces: types.KeyValue[] = [];
	let pieceId = 1;
	for (let row = 0; row < picturePuzzleGridSize.value; row++) {
		for (let col = 0; col < picturePuzzleGridSize.value; col++) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			ctx.drawImage(
				sourceImage,
				col * pieceWidth,
				row * pieceHeight,
				pieceWidth,
				pieceHeight,
				0,
				0,
				canvasWidth,
				canvasHeight,
			);
			const dataUrl = mimeType === "image/jpeg" ? canvas.toDataURL("image/jpeg") : canvas.toDataURL("image/png");
			const blob = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
			// Use the data URL itself; wrapping the base64 string in a Blob is not image bytes.
			pieces.push({
				piece_id: pieceId,
				mime_type: mimeType,
				blob: blob,
				blobUrl: dataUrl,
				width: pieceWidth,
				height: pieceHeight,
				can_slide: false,
			});
			pieceId++;
		}
	}
	pieces = shuffleArray(pieces);
	let pieceCol = 0;
	let pieceRow = 0;
	for (const piece of pieces) {
		piece.col = pieceCol;
		piece.row = pieceRow;
		piece.x = pieceCol * canvasWidth;
		piece.y = pieceRow * canvasHeight;
		piece.can_slide = false;
		pieceCol++;
		if (pieceCol === picturePuzzleGridSize.value) {
			pieceCol = 0;
			pieceRow++;
		}
	}
	//debug: delete the last piece
	// The removed tile leaves the hole; only tiles sharing an edge with that hole can drag.
	const emptyPiece = pieces[pieces.length - 1];
	if (emptyPiece) {
		picturePuzzleEmptySpot.value = {
			x: emptyPiece.x as number,
			y: emptyPiece.y as number,
			col: emptyPiece.col as number,
			row: emptyPiece.row as number,
		};
	}
	pieces.pop();
	picturePuzzleGrid.value = pieces;
	picturePuzzleCanvasWidth.value = canvasWidth * picturePuzzleGridSize.value;
	picturePuzzleCanvasHeight.value = canvasHeight * picturePuzzleGridSize.value;
	updatePicturePuzzleDragState();
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("displayPicturePuzzle: picturePuzzleGrid: ", JSON.parse(JSON.stringify(picturePuzzleGrid.value)));
	}
};
const slidePicturePuzzlePiece = async (event: Event) => {
	stopPicturePuzzleAxisLock();
	const item = (event as Event & { item?: HTMLElement }).item;
	const pieceId = Number(item?.dataset?.pieceId);
	const piece = picturePuzzleGrid.value.find((entry) => entry.piece_id === pieceId);
	if (!piece || piece.can_slide !== true) {
		return;
	}
	const nextX = picturePuzzleEmptySpot.value.x;
	const nextY = picturePuzzleEmptySpot.value.y;
	const nextCol = picturePuzzleEmptySpot.value.col;
	const nextRow = picturePuzzleEmptySpot.value.row;
	picturePuzzleEmptySpot.value = {
		x: piece.x as number,
		y: piece.y as number,
		col: piece.col as number,
		row: piece.row as number,
	};
	piece.x = nextX;
	piece.y = nextY;
	piece.col = nextCol;
	piece.row = nextRow;
	updatePicturePuzzleDragState();
};
const choosePicturePuzzlePiece = async (event: Event) => {
	console.log("choosePicturePuzzlePiece: event: ", event);
};
const selectPicturePuzzleImage = async (event: Event) => {
	event.preventDefault();
};
const handleFileSelect = async (event: Event) => {
	picturePuzzleImage.value = (event.target as HTMLInputElement)?.files?.[0] || null;
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("handleFileSelect: picturePuzzleImage: ", picturePuzzleImage.value);
	}
};
const uploadPicturePuzzleImage = async (event: Event) => {
	event.preventDefault();
	event.stopPropagation();

	const formData = new FormData();
	if (picturePuzzleImage.value) {
		formData.append("file", picturePuzzleImage.value);
	}
	const uploadPicturePuzzleImageRes = await API.uploadPicturePuzzleImage(formData);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log(
			"uploadPicturePuzzleImage: uploadPicturePuzzleImageRes: ",
			JSON.parse(JSON.stringify(uploadPicturePuzzleImageRes)),
		);
	}
};
const getPicturePuzzleImages = async () => {
	const getPicturePuzzleImagesRes = await API.getPicturePuzzleImages();
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log(
			"getPicturePuzzleImages: getPicturePuzzleImagesRes: ",
			JSON.parse(JSON.stringify(getPicturePuzzleImagesRes)),
		);
	}
	if (
		getPicturePuzzleImagesRes.success == true &&
		getPicturePuzzleImagesRes.results &&
		Array.isArray(getPicturePuzzleImagesRes.results)
	) {
		for (const image of getPicturePuzzleImagesRes.results as types.KeyValue[]) {
			picturePuzzleImageOptions.value.push(image);
		}
		if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
			console.log(
				"getPicturePuzzleImages: picturePuzzleImageOptions: ",
				JSON.parse(JSON.stringify(picturePuzzleImageOptions.value)),
			);
		}
	}
};
onMounted(async () => {
	await getPicturePuzzleImages()
		.then(async () => {
			await displayPicturePuzzle();
		})
		.catch((error) => {
			console.error("Error getting picture puzzle images: ", error);
		});
});

onBeforeUnmount(() => {
	stopPicturePuzzleAxisLock();
});
</script>

<template>
	<div class="pageTitle">
		<h1>Portfolio</h1>
	</div>
	<div class="pageContent">
		<div class="portfolio">
			<div class="portfolioItem">
				<div class="portfolioItemTitle">
					<h2>Picture Puzzle</h2>
				</div>
				<div class="portfolioItemDescription">
					<p>A picture puzzle game built with Vue.js and TypeScript.</p>
				</div>
				<div class="portfolioItemContent">
					<div id="picturePuzzleForm">
						<div class="picturePuzzleFormItem">
							<label for="picturePuzzleGridSize">Grid Size</label>
							<select
								id="picturePuzzleGridSize"
								v-model="picturePuzzleGridSize"
								@change="async () => await displayPicturePuzzle()"
							>
								<option v-for="option in picturePuzzleGridSizeOptions" :value="option">
									{{ option }}
								</option>
							</select>
						</div>
						<div class="picturePuzzleFormItem">
							<label for="picturePuzzleImageOption">Image Option</label>
							<div class="radioGroup">
								<div
									class="radio"
									v-for="option in picturePuzzleImageOptions"
									:key="option.picture_puzzle_image_id as string"
								>
									<label for="option.key as string" class="picturePuzzleImageOptionRadio label"
										><img
											:src="`data: ${option.mime_type as string};base64, ${option.blob as string}`"
									/></label>
									<input
										id="option.key as string"
										type="radio"
										:value="option.key as string"
										v-model="picturePuzzleImageOption"
										:checked="
											picturePuzzleImageOption === (option.picture_puzzle_image_id as number)
										"
										@change="async () => await displayPicturePuzzle()"
									/>
								</div>
							</div>
						</div>
						<div class="picturePuzzleFormItem" v-if="appStore.authenticated == true">
							<label for="picturePuzzleImage">Image</label>
							<input
								type="file"
								id="picturePuzzleImage"
								@change="async (event: Event) => await handleFileSelect(event)"
								accept="image/*"
							/>
						</div>
						<div class="picturePuzzleFormItem" v-if="picturePuzzleImage && appStore.authenticated == true">
							<button
								class="button primary"
								@click="async (event: Event) => await uploadPicturePuzzleImage(event)"
							>
								Upload Image to API
							</button>
						</div>
					</div>
					<canvas
						ref="picturePuzzleCanvas"
						class="picturePuzzleWorkCanvas"
						:width="picturePuzzleCanvasWidth"
						:height="picturePuzzleCanvasHeight"
						aria-hidden="true"
						style="display: none"
					></canvas>
					<draggable
						id="picturePuzzleGridContainer"
						ref="element"
						v-if="picturePuzzleGrid.length > 0"
						v-model="picturePuzzleGrid"
						draggable=".canSlide"
						filter=".picturePuzzleGridItem:not(.canSlide)"
						:prevent-on-filter="true"
						:force-fallback="true"
						:fallback-on-body="true"
						:sort="false"
						:style="{
							width: picturePuzzleCanvasWidth + 'px',
							height: picturePuzzleCanvasHeight + 'px',
						}"
						@start="(event: Event) => startPicturePuzzleAxisLock(event)"
						@end="async (event: Event) => await slidePicturePuzzlePiece(event)"
						@choose="async (event: Event) => await choosePicturePuzzlePiece(event)"
					>
						<div
							class="picturePuzzleGridItem"
							:class="{ canSlide: piece.can_slide === true }"
							v-for="piece in picturePuzzleGrid"
							:key="piece.piece_id as number"
							:data-piece-id="piece.piece_id as number"
							:style="picturePuzzlePieceStyle(piece)"
						></div>
					</draggable>
				</div>
			</div>
		</div>
	</div>
</template>
