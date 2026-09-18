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
			pieces.push({
				piece_id: pieceId,
				mime_type: mimeType,
				blob: blob,
				width: pieceWidth,
				height: pieceHeight,
			});
			pieceId++;
		}
	}
	pieces = shuffleArray(pieces);
	let pieceY = 0;
	let pieceX = 0;
	for await (const piece of pieces) {
		piece.x = pieceX;
		piece.y = pieceY;

		if (pieceX + (piece.width as number) == canvasWidth * picturePuzzleGridSize.value) {
			pieceX = 0;
			pieceY += piece.height as number;
		} else {
			pieceX += piece.width as number;
		}
	}
	//debug: delete the last piece
	pieces.pop();
	picturePuzzleGrid.value = pieces;
	picturePuzzleCanvasWidth.value = canvasWidth * picturePuzzleGridSize.value;
	picturePuzzleCanvasHeight.value = canvasHeight * picturePuzzleGridSize.value;
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
		console.log("displayPicturePuzzle: picturePuzzleGrid: ", JSON.parse(JSON.stringify(picturePuzzleGrid.value)));
	}
};
const slidePicturePuzzlePiece = async (event: Event) => {
	console.log("slidePicturePuzzlePiece: event: ", event);
	console.log("slidePicturePuzzlePiece: element: ", element.value);
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

onBeforeUnmount(() => {});
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
						<!-- <div class="picturePuzzleFormItem">
							<label for="picturePuzzleImageOption">Image Option</label>
							<select
								id="picturePuzzleImageOption"
								v-model="picturePuzzleImageOption"
								@change="async () => await displayPicturePuzzle()"
							>
								<option v-for="option in picturePuzzleImageOptions" :value="option">
									{{ option }}
								</option>
							</select>
						</div> -->
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
						target=".picturePuzzleGridItem"
						:style="{
							width: picturePuzzleCanvasWidth + 'px',
							height: picturePuzzleCanvasHeight + 'px',
						}"
						@onChange="async (event: Event) => await slidePicturePuzzlePiece(event)"
						@onChoose="async (event: Event) => await choosePicturePuzzlePiece(event)"
					>
						<img
							class="picturePuzzleGridItem"
							v-for="piece in picturePuzzleGrid"
							:key="piece.piece_id as number"
							:style="{
								left: (piece.x as number) + 'px',
								top: (piece.y as number) + 'px',
								width: (piece.width as number) + 'px',
								height: (piece.height as number) + 'px',
							}"
							:src="`data:${piece.mime_type as string};base64,${piece.blob as string}`"
						/>
					</draggable>
				</div>
			</div>
		</div>
	</div>
</template>
