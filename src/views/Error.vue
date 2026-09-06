<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { Check, X, Pencil, Trash, Plus } from "@lucide/vue";

const API = new APIClass();
const appStore = useAppStore();
</script>

<template>
	<h1>Error</h1>
	<p>An error occurred while loading the page.</p>
</template>

<style lang="scss"></style>
