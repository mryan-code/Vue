<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";

const API = new APIClass();
const appStore = useAppStore();

onMounted(async () => {});

onBeforeUnmount(() => {});
</script>

<template>
	<div class="pageTitle">
		<h1>Home</h1>
	</div>
	<div class="pageContent">
		<p>Welcome to the home page.</p>

		<p>
			This site has both a frontend and a backend. The frontend is built with Vue.js and TypeScript, while the
			backend is built with Node.js and TypeScript. The frontend uses Cypress for testing, although I personally
			prefer Selenium. I like Vue because it gives me a lot of functionality in one package, but I’m not married
			to it. If another framework is a better fit for a project, I’m happy to use it.
		</p>

		<p>
			The backend uses Jest for testing and Sequelize as the ORM, with PostgreSQL handling the database. I
			normally prefer MySQL, but PostgreSQL made more sense for this project, particularly because of the AI
			component.
		</p>

		<p>
			There’s also a second backend written in Python using FastAPI. That handles the AI API and keeps the LLM
			functionality separate from the main application.
		</p>

		<p>
			The entire site is hosted on a Mac Mini sitting in my house. It’s probably a little overkill for a web
			server, but I needed the horsepower for the AI/LLM system running alongside it. So yes, there is a fairly
			serious computer sitting in my house serving this little website.
		</p>

		<p>
			And, because apparently letting the entire internet throw requests directly at my LLM sounded like a
			terrible idea, I also built an authentication system for the site. It keeps the AI API behind authentication
			and gives me a little more control over who (and what) gets to interact with it.
		</p>
	</div>
</template>
