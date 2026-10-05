<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, type Component } from "vue";
import { ArrowDown, Bot, Code, Cpu, LogIn, Puzzle, Search, Server, Sparkles } from "@lucide/vue";

// The home page is now a landing in the shape of the Freebuff desktop page.
// The copy is the previous bio, split into a hero, a stack card, page links, and an FAQ.
// Deprecated code: the old home page imported the API, the store, and unused icons, then rendered a title and paragraphs.
// import APIClass from "@/classes/API";
// import { useAppStore } from "@/store/app";
// import * as types from "@/types";
// import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
// import moment from "moment-timezone";

type LandingRow = {
	name: string;
	note: string;
	width: string;
	icon: Component;
};

type LandingPage = {
	title: string;
	note: string;
	to: string;
	icon: Component;
};

type LandingFaq = {
	number: string;
	question: string;
	answer: string;
};

// Bar length is only a visual weight for each layer. These are not prices.
const stackRows: LandingRow[] = [
	{
		name: "Vue frontend",
		note: "Vue and TypeScript",
		width: "42%",
		icon: Code,
	},
	{
		name: "Node API",
		note: "Jest, Sequelize, PostgreSQL",
		width: "58%",
		icon: Server,
	},
	{
		name: "Python AI API",
		note: "FastAPI, kept separate",
		width: "74%",
		icon: Bot,
	},
	{
		name: "Mac Mini",
		note: "The machine in the house",
		width: "90%",
		icon: Cpu,
	},
];

const pages: LandingPage[] = [
	{
		title: "Portfolio",
		note: "The frontend work on this site.",
		to: "/portfolio",
		icon: Puzzle,
	},
	{
		title: "Storm Zero",
		note: "The AI API, kept separate and behind authentication.",
		to: "/storm-zero",
		icon: Sparkles,
	},
	{
		title: "OSINT",
		note: "A lookup for a name, email, or phone.",
		to: "/osint",
		icon: Search,
	},
	{
		title: "Login",
		note: "Sign in before the AI API will answer.",
		to: "/login",
		icon: LogIn,
	},
];

type LandingStar = {
	left: string;
	top: string;
	size: string;
	glow: string;
	dur: string;
	delay: string;
};

type LandingShot = {
	left: string;
	top: string;
	dx: string;
	dy: string;
	dur: string;
	delay: string;
};

// Stable 0-1 value so the star field does not jump on each render.
const mix = (seed: number) => {
	const value = Math.sin(seed * 127.1) * 43758.5453;
	return value - Math.floor(value);
};

// A star in either the hero night sky or the cloudy sky under the chart.
const makeStar = (index: number, top: string): LandingStar => {
	const size = mix(index + 3) > 0.72 ? 3 : 2;
	return {
		left: `${(mix(index + 1) * 92 + 4).toFixed(2)}%`,
		top: top,
		size: `${size}px`,
		glow: `${size + 2}px`,
		dur: `${(3.2 + mix(index + 21) * 3.4).toFixed(2)}s`,
		delay: `${(mix(index + 31) * 4).toFixed(2)}s`,
	};
};

// vh, not a percent of the whole page, so the first screen is actually a sky.
const stars: LandingStar[] = Array.from({ length: 28 }, (_star, index) => {
	return makeStar(index, `${(5 + mix(index + 11) * 68).toFixed(1)}vh`);
});

// The band under the chart. These sit on the cloud photograph, above the hills.
const groundStars: LandingStar[] = Array.from({ length: 16 }, (_star, index) => {
	const seed = index + 80;
	return makeStar(seed, `${(8 + mix(seed + 11) * 44).toFixed(1)}%`);
});

// Streaks that cross the hero, then wait before repeating.
const shots: LandingShot[] = Array.from({ length: 6 }, (_shot, index) => {
	return {
		left: `${(8 + index * 14) % 78}%`,
		top: `${6 + index * 7}%`,
		dx: `${300 + Math.round(mix(index + 41) * 160)}px`,
		dy: `${150 + Math.round(mix(index + 51) * 110)}px`,
		dur: `${(6 + mix(index + 61) * 2).toFixed(1)}s`,
		delay: `${(0.4 + index * 1.15).toFixed(1)}s`,
	};
});

// Scroll shifts. Far layers move more than near ones, which is the parallax.
const skyShift = ref(0);
const hillShift = ref(0);
const bushShift = ref(0);
let parallaxFrame = 0;
let parallaxListening = false;

const updateParallax = () => {
	parallaxFrame = 0;
	const y = window.scrollY;
	skyShift.value = y * 0.32;
	hillShift.value = y * 0.16;
	bushShift.value = y * 0.07;
};

const onScroll = () => {
	if (parallaxFrame) {
		return;
	}
	parallaxFrame = window.requestAnimationFrame(updateParallax);
};

onMounted(() => {
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduceMotion) {
		return;
	}
	parallaxListening = true;
	window.addEventListener("scroll", onScroll, { passive: true });
	updateParallax();
});

onBeforeUnmount(() => {
	if (parallaxListening) {
		window.removeEventListener("scroll", onScroll);
	}
	if (parallaxFrame) {
		window.cancelAnimationFrame(parallaxFrame);
	}
});

const faqs: LandingFaq[] = [
	{
		number: "01",
		question: "The Stack?",
		answer: "This site has both a frontend and a two backends. The frontend is built with Vue.js and TypeScript, while the two backends are built with Node.js and TypeScript, then Python with FastAPI. The frontend uses Cypress for testing, although I personally prefer Selenium. I like Vue because it gives me a lot of functionality in one package, but I’m not married to it. If another framework is a better fit for a project, I’m happy to use it.",
	},
	{
		number: "02",
		question: "Why PostgreSQL?",
		answer: "The backend uses Jest for testing and Sequelize as the ORM, with PostgreSQL handling the database. I normally prefer MySQL, but PostgreSQL made more sense for this project, particularly because of the AI component. PostgreSQL solved the context window issue with the LLM.",
	},
	{
		number: "03",
		question: "Why a second backend?",
		answer: "There’s also a second backend written in Python using FastAPI. That handles the AI API and keeps the LLM functionality separate from the main application. It also allows for the LLM to be scaled independently of the main application. The LLM can be hosted on a separate machine, as it's heavier than the main application.",
	},
	{
		number: "04",
		question: "Why a Mac Mini?",
		answer: "The entire site is hosted on a Mac Mini sitting in my house. It’s probably a little overkill for a web server, but I needed the horsepower for the AI/LLM system running alongside it. So yes, there is a fairly serious computer sitting in my house serving this little website.",
	},
	{
		number: "05",
		question: "Why authentication?",
		answer: "And, because apparently letting the entire internet throw requests directly at my LLM sounded like a terrible idea, I also built an authentication system for the site. It keeps the AI API behind authentication and gives me a little more control over who (and what) gets to interact with it.",
	},
];
</script>

<template>
	<div class="landing">
		<div class="landingScene" aria-hidden="true">
			<div class="landingWash" :style="{ transform: `translate3d(0, ${skyShift}px, 0)` }"></div>
			<span
				class="landingStar"
				v-for="(star, index) in stars"
				:key="`star-${index}`"
				:style="{
					left: star.left,
					top: star.top,
					width: star.size,
					height: star.size,
					'--glow': star.glow,
					'--dur': star.dur,
					'--delay': star.delay,
					transform: `translate3d(0, ${skyShift}px, 0)`,
				}"
			></span>
			<span
				class="landingShootWrap"
				v-for="(shot, index) in shots"
				:key="`shot-${index}`"
				:style="{
					left: shot.left,
					top: shot.top,
					transform: `translate3d(0, ${skyShift * 0.5}px, 0)`,
				}"
			>
				<span
					class="landingShoot"
					:style="{
						'--dx': shot.dx,
						'--dy': shot.dy,
						'--dur': shot.dur,
						'--delay': shot.delay,
					}"
				>
					<span class="landingShootTrail"></span>
				</span>
			</span>
		</div>

		<section class="landingHero">
			<h1 class="landingHeroTitle">
				<span class="landingHeroLead">A frontend, a backend,</span>
				<span class="landingHeroAccent">and an LLM in the house</span>
			</h1>
			<p class="landingHeroSub">
				Vue and TypeScript up front. Node, Sequelize, and PostgreSQL behind that. A second API, written in
				Python with FastAPI, keeps the LLM separate.
			</p>
			<router-link class="landingPill" to="/portfolio">
				<ArrowDown />
				<span>See the work</span>
			</router-link>
			<p class="landingHeroLinks">
				<router-link to="/portfolio">Portfolio</router-link>
				<router-link to="/visual-resume">Visual Resume</router-link>
			</p>
		</section>

		<section class="landingProofWrap">
			<p class="landingProof">Hosted on a <strong>Mac Mini</strong>, with the AI API behind authentication.</p>
			<div class="landingCard">
				<div class="landingStackRow" v-for="row in stackRows" :key="row.name">
					<div class="landingStackName">
						<component :is="row.icon" />
						<span>{{ row.name }}</span>
					</div>
					<div class="landingStackTrack">
						<div class="landingStackBar" :style="{ width: row.width }"></div>
						<span>{{ row.note }}</span>
					</div>
				</div>
			</div>
		</section>

		<div class="landingGround" aria-hidden="true">
			<div class="landingGroundWash" :style="{ transform: `translate3d(0, ${skyShift * 0.12}px, 0)` }"></div>
			<span
				class="landingStar"
				v-for="(star, index) in groundStars"
				:key="`ground-star-${index}`"
				:style="{
					left: star.left,
					top: star.top,
					width: star.size,
					height: star.size,
					'--glow': star.glow,
					'--dur': star.dur,
					'--delay': star.delay,
					transform: `translate3d(0, ${skyShift * 0.08}px, 0)`,
				}"
			></span>
			<img
				class="landingLayer landingHillsPhoto"
				src="/landing/hills-bg.webp"
				alt=""
				:style="{ transform: `translate3d(0, ${hillShift * 0.35}px, 0)` }"
			/>
			<img
				class="landingLayer landingBushes"
				src="/landing/bushes-fg.webp"
				alt=""
				:style="{ transform: `translate3d(0, ${bushShift * 0.2}px, 0)` }"
			/>
			<div class="landingGreenVeil"></div>
			<div class="landingGroundFade"></div>
		</div>

		<!-- <section class="landingPages">
			<p class="landingEyebrow">Pages</p>
			<h2>Pick a page</h2>
			<p class="landingSectionSub">
				The work, the AI, a lookup, and the login that keeps the model from answering the open internet.
			</p>
			<router-link class="landingPageRow" v-for="page in pages" :key="page.to" :to="page.to">
				<div class="landingPageIcon">
					<component :is="page.icon" />
				</div>
				<div class="landingPageText">
					<strong>{{ page.title }}</strong>
					<span>{{ page.note }}</span>
				</div>
				<ArrowDown class="landingPageArrow" />
			</router-link>
		</section> -->

		<section class="landingFaq">
			<h2>FAQs</h2>
			<details v-for="faq in faqs" :key="faq.number">
				<summary>
					<span class="landingFaqNumber">{{ faq.number }}</span>
					<span>{{ faq.question }}</span>
				</summary>
				<p>{{ faq.answer }}</p>
			</details>
		</section>

		<footer class="landingFooter">
			<p class="landingFooterMark">WebDev Matt</p>
			<nav>
				<router-link to="/">Home</router-link>
				<router-link to="/portfolio">Portfolio</router-link>
				<router-link to="/storm-zero">Storm Zero</router-link>
				<router-link to="/osint">OSINT</router-link>
				<router-link to="/login">Login</router-link>
			</nav>
		</footer>
	</div>
</template>

<style lang="scss" scoped>
.landing {
	position: relative;
	margin: calc(var(--padding) * -1);
	width: calc(100% + (var(--padding) * 2));
	color: var(--body-text);
	overflow: hidden;
}

// Full-page night scene. Layers are shifted from the scroll handler so nearer hills lag less.
.landingScene {
	position: absolute;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	overflow: hidden;
}

.landingWash {
	position: absolute;
	left: 0;
	right: 0;
	top: -8vh;
	height: 78vh;
	background: linear-gradient(to bottom, transparent 0%, rgba(16, 36, 40, 0.55) 42%, rgba(7, 8, 10, 0) 100%);
	will-change: transform;
}

.landingStar {
	position: absolute;
	border-radius: 999px;
	background: #ffffff;
	box-shadow: 0 0 var(--glow) rgba(255, 255, 255, 0.85);
	animation: landing-twinkle var(--dur) ease-in-out var(--delay) infinite;
	will-change: transform, opacity;
}

.landingShootWrap {
	position: absolute;
	will-change: transform;
}

.landingShoot {
	display: block;
	opacity: 0;
	animation: landing-shoot var(--dur) ease-out var(--delay) infinite;
	will-change: transform, opacity;
}

.landingShootTrail {
	display: block;
	width: 110px;
	height: 1px;
	transform: rotate(28deg);
	transform-origin: left center;
	background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 90%, #ffffff 100%);
	box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

// Deprecated code: flat green hill silhouettes.
// .landingHills {
// 	position: absolute;
// 	left: 0;
// 	width: 120%;
// 	margin-left: -10%;
// 	height: 34vh;
// 	min-height: 160px;
// 	will-change: transform;
// }
// .landingHillsFar {
// 	top: 54vh;
// 	color: #24322c;
// 	opacity: 0.95;
// }
// .landingHillsNear {
// 	top: 68vh;
// 	height: 28vh;
// 	color: #101614;
// }

@keyframes landing-twinkle {
	0%,
	100% {
		opacity: 0.35;
	}
	50% {
		opacity: 1;
	}
}

@keyframes landing-shoot {
	0% {
		opacity: 0;
		transform: translate3d(0, 0, 0);
	}
	2% {
		opacity: 1;
	}
	9% {
		opacity: 0;
		transform: translate3d(var(--dx), var(--dy), 0);
	}
	100% {
		opacity: 0;
		transform: translate3d(var(--dx), var(--dy), 0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.landingStar,
	.landingShoot {
		animation: none;
	}
	.landingShoot {
		opacity: 0;
	}
}

:global([data-theme="light"]) .landingWash {
	background: linear-gradient(to bottom, transparent 0%, rgba(95, 115, 84, 0.16) 46%, transparent 100%);
}

:global([data-theme="light"]) .landingStar {
	background: #3e4d36;
	box-shadow: 0 0 var(--glow) rgba(62, 77, 54, 0.45);
}

:global([data-theme="light"]) .landingShootTrail {
	background: linear-gradient(90deg, rgba(62, 77, 54, 0) 0%, rgba(62, 77, 54, 0.85) 100%);
	box-shadow: none;
}

// Deprecated code: the solid hill colors.
// :global([data-theme="light"]) .landingHillsFar {
// 	color: #c5d0c0;
// }
// :global([data-theme="light"]) .landingHillsNear {
// 	color: #aeb9a8;
// }

:global([data-theme="light"]) .landingGroundWash {
	background: linear-gradient(
		to bottom,
		rgba(255, 255, 255, 0) 0%,
		#d7e0d0 36%,
		#c5d0c0 62%,
		rgba(255, 255, 255, 0) 100%
	);
}

:global([data-theme="light"]) .landingGreenVeil {
	background: linear-gradient(to bottom, rgba(197, 208, 192, 0.1) 0%, rgba(140, 160, 126, 0.35) 24%, transparent 64%);
	mix-blend-mode: multiply;
}

:global([data-theme="light"]) .landingGroundFade {
	background: linear-gradient(to bottom, var(--body-bg) 0%, transparent 22%, transparent 52%, var(--body-bg) 86%);
}

.landingHero,
.landingProofWrap,
.landingPages,
.landingFaq,
.landingFooter {
	position: relative;
	z-index: 1;
	max-width: 860px;
	margin: 0 auto;
	padding: 0 24px;
	box-sizing: border-box;
}

.landingHero {
	min-height: calc(100vh - var(--header-height));
	display: -webkit-flex;
	display: flex;
	-webkit-flex-direction: column;
	flex-direction: column;
	-webkit-justify-content: center;
	justify-content: center;
	-webkit-align-items: center;
	align-items: center;
	text-align: center;
	padding-top: 24px;
	padding-bottom: 48px;
}

.landingHeroTitle {
	margin: 0;
	font-family: var(--heading-font-family);
	font-size: clamp(2.5rem, 6vw, 4.4rem);
	font-weight: 560;
	line-height: 1.05;
	letter-spacing: -0.03em;
	color: var(--headline);
	-webkit-text-stroke: 0;
}

.landingHeroLead,
.landingHeroAccent {
	display: block;
	-webkit-text-stroke: 0;
}

.landingHeroLead {
	color: var(--headline);
}

.landingHeroAccent {
	color: var(--primary);
}

.landingHeroSub,
.landingSectionSub {
	max-width: 640px;
	margin: 22px auto 0;
	color: var(--body-text);
	font-size: 1.15rem;
	line-height: 1.5;
}

.landingPill {
	display: -webkit-inline-flex;
	display: inline-flex;
	-webkit-align-items: center;
	align-items: center;
	gap: 10px;
	margin-top: 32px;
	padding: 14px 26px;
	border-radius: 999px;
	background: var(--pill-bg);
	color: var(--pill-text);
	text-decoration: none;
	font-weight: 650;
	font-size: 1.05rem;
	:deep(svg) {
		width: 18px;
		height: 18px;
		stroke: var(--pill-text);
	}
}

.landingHeroLinks {
	margin: 18px 0 0;
	display: -webkit-flex;
	display: flex;
	gap: 22px;
	justify-content: center;
	a {
		color: var(--body-text);
		text-decoration: none;
	}
	a:hover {
		color: var(--headline);
	}
}

.landingProofWrap {
	padding-bottom: 0;
}

// One landscape. The wash is the green, and each photo is masked so it fades into that green and into the page.
.landingGround {
	position: relative;
	z-index: 0;
	height: 78vh;
	min-height: 440px;
	margin-top: -8vh;
	margin-bottom: -14vh;
	overflow: hidden;
	pointer-events: none;
}

.landingGroundWash {
	position: absolute;
	left: 0;
	right: 0;
	top: 34%;
	height: 36%;
	background: linear-gradient(
		to bottom,
		rgba(7, 11, 17, 0) 0%,
		rgba(16, 31, 35, 0.55) 40%,
		rgba(23, 42, 41, 0.4) 70%,
		rgba(7, 10, 11, 0) 100%
	);
	will-change: transform;
}

.landingLayer {
	position: absolute;
	left: 0;
	width: 100%;
	object-fit: cover;
	user-select: none;
	pointer-events: none;
	will-change: transform;
}

// Deprecated code: the brown dune band. The crop put the tan ridges under the stack card.
// .landingSkyBg {
// 	z-index: 1;
// 	top: 0;
// 	height: auto;
// 	aspect-ratio: 1400 / 150;
// 	object-position: center 20%;
// 	opacity: 0.88;
// 	filter: brightness(0.82) saturate(0.78);
// 	-webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 58%, transparent 100%);
// 	mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 58%, transparent 100%);
// }

.landingGround .landingStar {
	z-index: 2;
}

.landingHillsPhoto {
	z-index: 3;
	top: 34%;
	height: 58%;
	object-position: center 28%;
	filter: brightness(0.9) contrast(1.05) saturate(0.9);
	-webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 28%, #000 72%, transparent 100%);
	mask-image: linear-gradient(to bottom, transparent 0%, #000 28%, #000 72%, transparent 100%);
}

.landingBushes {
	z-index: 4;
	bottom: -4%;
	height: 28%;
	object-position: center bottom;
	transform-origin: center bottom;
	filter: brightness(0.55) saturate(0.8);
	-webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 68%, transparent 100%);
	mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 68%, transparent 100%);
}

// The green sits on the ridge where the sky meets the hills, and leaves the sky itself clear.
.landingGreenVeil {
	position: absolute;
	z-index: 5;
	left: 0;
	right: 0;
	top: 42%;
	bottom: 0;
	background: linear-gradient(
		to bottom,
		rgba(48, 72, 56, 0) 0%,
		rgba(48, 72, 56, 0.4) 24%,
		rgba(90, 112, 82, 0.2) 48%,
		rgba(90, 112, 82, 0) 78%
	);
	mix-blend-mode: soft-light;
}

.landingGroundFade {
	position: absolute;
	z-index: 6;
	inset: 0;
	background: linear-gradient(to bottom, var(--body-bg) 0%, transparent 8%, transparent 62%, var(--body-bg) 90%);
}

.landingProof {
	text-align: center;
	font-size: clamp(1.4rem, 3vw, 2rem);
	color: var(--body-text);
	margin: 0 0 28px;
	strong {
		color: var(--headline);
		font-weight: 650;
	}
}

.landingCard {
	background: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: 28px;
	padding: 22px 22px 8px;
}

.landingStackRow {
	display: -webkit-flex;
	display: flex;
	-webkit-align-items: center;
	align-items: center;
	gap: 16px;
	margin-bottom: 18px;
}

.landingStackName {
	display: -webkit-flex;
	display: flex;
	-webkit-align-items: center;
	align-items: center;
	gap: 10px;
	width: 190px;
	flex: 0 0 190px;
	color: var(--headline);
	font-weight: 600;
	:deep(svg) {
		width: 18px;
		height: 18px;
		stroke: var(--headline);
	}
}

.landingStackTrack {
	flex: 1 1 auto;
	display: -webkit-flex;
	display: flex;
	-webkit-align-items: center;
	align-items: center;
	gap: 12px;
	min-width: 0;
	span {
		color: var(--body-text);
		white-space: nowrap;
	}
}

.landingStackBar {
	height: 10px;
	border-radius: 999px;
	background: linear-gradient(90deg, var(--primary-accent), var(--primary));
	box-shadow: 0 0 16px var(--primary-highlight);
}

.landingPages,
.landingFaq {
	padding-bottom: 64px;
	text-align: center;
}

.landingEyebrow {
	margin: 0 0 10px;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: var(--primary);
	font-size: 0.78rem;
	font-weight: 650;
}

.landingPages h2,
.landingFaq h2 {
	margin: 0;
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 560;
	color: var(--headline);
	-webkit-text-stroke: 0;
}

.landingPageRow {
	display: -webkit-flex;
	display: flex;
	-webkit-align-items: center;
	align-items: center;
	gap: 16px;
	text-align: left;
	text-decoration: none;
	background: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: 18px;
	padding: 16px 18px;
	margin-top: 12px;
	color: var(--headline);
}

.landingPageIcon {
	width: 42px;
	height: 42px;
	border-radius: 12px;
	border: 1px solid var(--card-border);
	display: -webkit-flex;
	display: flex;
	-webkit-align-items: center;
	align-items: center;
	-webkit-justify-content: center;
	justify-content: center;
	flex: 0 0 42px;
	:deep(svg) {
		width: 18px;
		height: 18px;
		stroke: var(--headline);
	}
}

.landingPageText {
	display: -webkit-flex;
	display: flex;
	-webkit-flex-direction: column;
	flex-direction: column;
	gap: 2px;
	flex: 1 1 auto;
	strong {
		color: var(--headline);
		font-size: 1.05rem;
	}
	span {
		color: var(--body-text);
	}
}

.landingPageArrow {
	width: 18px;
	height: 18px;
	stroke: var(--body-text);
	transform: rotate(-90deg);
	flex: 0 0 auto;
}

.landingFaq {
	text-align: left;
	h2 {
		text-align: center;
		margin-bottom: 12px;
	}
	details {
		border-bottom: 1px solid var(--card-border);
		padding: 18px 0;
	}
	summary {
		cursor: pointer;
		list-style: none;
		display: -webkit-flex;
		display: flex;
		-webkit-align-items: center;
		align-items: center;
		gap: 16px;
		color: var(--headline);
		font-size: 1.2rem;
		font-weight: 560;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	p {
		margin: 12px 0 0 52px;
		color: var(--body-text);
		line-height: 1.55;
	}
}

.landingFaqNumber {
	color: var(--body-text);
	font-variant-numeric: tabular-nums;
	min-width: 36px;
}

.landingFooter {
	display: -webkit-flex;
	display: flex;
	-webkit-flex-wrap: wrap;
	flex-wrap: wrap;
	-webkit-justify-content: space-between;
	justify-content: space-between;
	-webkit-align-items: center;
	align-items: center;
	gap: 16px;
	padding-top: 28px;
	padding-bottom: 40px;
	border-top: 1px solid var(--card-border);
	nav {
		display: -webkit-flex;
		display: flex;
		-webkit-flex-wrap: wrap;
		flex-wrap: wrap;
		gap: 16px;
	}
	a {
		color: var(--body-text);
		text-decoration: none;
	}
	a:hover {
		color: var(--headline);
	}
}

.landingFooterMark {
	margin: 0;
	color: var(--headline);
	font-weight: 650;
}

@media only screen and (max-width: 700px) {
	.landingStackRow {
		-webkit-flex-direction: column;
		flex-direction: column;
		-webkit-align-items: stretch;
		align-items: stretch;
	}
	.landingStackName {
		width: auto;
		flex-basis: auto;
	}
}
</style>
