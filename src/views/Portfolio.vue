<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";

const API = new APIClass();
const appStore = useAppStore();

const picturePuzzleGridSize = ref(3);
const picturePuzzleGridSizeOptions = [3, 6, 9];
const picturePuzzleImageOption = ref(1);
const picturePuzzleImageOptions = ref<types.KeyValue[]>([]);
const picturePuzzleGrid = ref<types.KeyValue | null>(null);

const picturePuzzleImage = ref<File | null>(null);

const displayPicturePuzzle = async () => {
	let image = picturePuzzleImageOptions.value[picturePuzzleImageOption.value];
	console.log("displayPicturePuzzle: image: ", JSON.parse(JSON.stringify(image)));
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
};
onMounted(async () => {
	await getPicturePuzzleImages();
	await displayPicturePuzzle();
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
					<div
						class="picturePuzzleGrid"
						v-if="
							picturePuzzleGrid &&
							picturePuzzleGrid.success == true &&
							picturePuzzleGrid.results &&
							Array.isArray(picturePuzzleGrid.results)
						"
					>
						<div
							class="picturePuzzleGridItem"
							v-for="image in picturePuzzleGrid.results as types.KeyValue[]"
							:key="image.picture_puzzle_image_id as string"
						>
							<img
								:src="image.picture_puzzle_image_url as string"
								:alt="image.picture_puzzle_image_name as string"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
