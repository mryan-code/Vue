<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";

const API = new APIClass();
const appStore = useAppStore();

const userName = ref("");
const userEmail = ref("");
const userPhone = ref("");
const osintResults = ref([]);

const osintRequest = async (event: Event) => {
	event.preventDefault();
	const formData = new FormData(event.target as HTMLFormElement);
	const data = Object.fromEntries(formData.entries());
	console.log(data);
};

onMounted(async () => {});

onBeforeUnmount(() => {});
</script>

<template>
	<div class="pageTitle">
		<h1>OSINT</h1>
	</div>
	<div class="pageContent">
		<p>Welcome to the OSINT page.</p>
		<div class="styledBlockForm">
			<div class="formRow">
				<span class="label">User's Name</span>
				<input type="text" v-model="userName" @keyup="async (event: Event) => await osintRequest(event)" />
			</div>
			<div class="formRow">
				<span class="label">User's Email</span>
				<input type="text" v-model="userEmail" @keyup="async (event: Event) => await osintRequest(event)" />
			</div>
			<div class="formRow">
				<span class="label">User's Phone</span>
				<input type="text" v-model="userPhone" @keyup="async (event: Event) => await osintRequest(event)" />
			</div>
		</div>
		<div class="styledTable">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
					</tr>
				</thead>
				<!-- <tbody v-if="osintResults.length > 0">
					<tr v-for="result in osintResults" :key="result.id">
						<td>{{ result.first_name }} {{ result.last_name }}</td>
						<td>{{ result.email }}</td>
						<td>{{ result.phone }}</td>
					</tr>
				</tbody> -->
			</table>
		</div>
	</div>
</template>
