<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";
import { createCanvas, loadImage } from "canvas";

const API = new APIClass();
const appStore = useAppStore();

const picturePuzzleGridSize = ref(3);
const picturePuzzleGridSizeOptions = [3, 6, 9];
const picturePuzzleImageOption = ref(1);
const picturePuzzleImageOptions = ref<types.KeyValue[]>([]);
const picturePuzzleGrid = ref<types.KeyValue[]>([]);

const picturePuzzleImage = ref<File | null>(null);

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
	console.log("displayPicturePuzzle: imageTemp: ", JSON.parse(JSON.stringify(imageTemp)));

	const sourceBlob = typeof imageTemp.blob === "string" ? imageTemp.blob : "";
	if (!sourceBlob) {
		return;
	}
	const sourceMimeType =
		typeof imageTemp.mime_type === "string" && imageTemp.mime_type ? imageTemp.mime_type : "image/png";
	// node-canvas toDataURL only accepts png/jpeg, so map other source types to png.
	const mimeType: "image/png" | "image/jpeg" =
		sourceMimeType === "image/jpeg" || sourceMimeType === "image/jpg" ? "image/jpeg" : "image/png";
	// canvas loadImage sets <img>.src; raw base64 is not a valid src, so wrap it as a data URL.
	let imageSrc = sourceBlob;
	if (
		!sourceBlob.startsWith("data:") &&
		!sourceBlob.startsWith("blob:") &&
		!sourceBlob.startsWith("http://") &&
		!sourceBlob.startsWith("https://")
	) {
		const cleanedBlob = sourceBlob.replace(/\s/g, "");
		let loadMimeType = sourceMimeType;
		if (cleanedBlob.startsWith("iVBOR")) {
			loadMimeType = "image/png";
		} else if (cleanedBlob.startsWith("/9j/")) {
			loadMimeType = "image/jpeg";
		} else if (cleanedBlob.startsWith("R0lGOD")) {
			loadMimeType = "image/gif";
		} else if (cleanedBlob.startsWith("UklGR")) {
			loadMimeType = "image/webp";
		}
		imageSrc = `data:${loadMimeType};base64,${cleanedBlob}`;
	}
	const sourceImage = await loadImage(imageSrc);
	const pieceWidth = sourceImage.width / picturePuzzleGridSize.value;
	const pieceHeight = sourceImage.height / picturePuzzleGridSize.value;
	const canvasWidth = Math.max(1, Math.round(pieceWidth));
	const canvasHeight = Math.max(1, Math.round(pieceHeight));
	const pieces: types.KeyValue[] = [];
	let pieceId = 0;
	for (let row = 0; row < picturePuzzleGridSize.value; row++) {
		for (let col = 0; col < picturePuzzleGridSize.value; col++) {
			const canvas = createCanvas(canvasWidth, canvasHeight);
			const ctx = canvas.getContext("2d");
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
			});
			pieceId++;
		}
	}
	picturePuzzleGrid.value = pieces;
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
		console.log("displayPicturePuzzle: picturePuzzleGrid: ", JSON.parse(JSON.stringify(picturePuzzleGrid.value)));
	}
};
const selectPicturePuzzleImage = async (event: Event) => {
	event.preventDefault();
};
const handleFileSelect = async (event: Event) => {
	picturePuzzleImage.value = (event.target as HTMLInputElement)?.files?.[0] || null;
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
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
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
		console.log(
			"uploadPicturePuzzleImage: uploadPicturePuzzleImageRes: ",
			JSON.parse(JSON.stringify(uploadPicturePuzzleImageRes)),
		);
	}
};
const getPicturePuzzleImages = async () => {
	const getPicturePuzzleImagesRes = await API.getPicturePuzzleImages();
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
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
	console.log(
		"getPicturePuzzleImages: picturePuzzleImageOptions: ",
		JSON.parse(JSON.stringify(picturePuzzleImageOptions.value)),
	);
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
					<div class="picturePuzzleGrid" v-if="picturePuzzleGrid.length > 0">
						<div
							class="picturePuzzleGridItem"
							v-for="image in picturePuzzleGrid as types.KeyValue[]"
							:key="image.piece_id as number"
						>
							<img
								:src="`data:${image.mime_type as string};base64,${image.blob as string}`"
								:alt="`Puzzle piece ${image.piece_id as number}`"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
