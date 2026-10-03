<script lang="ts" setup>
import type { Component } from "vue";
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

const faqs: LandingFaq[] = [
	{
		number: "01",
		question: "Why Vue?",
		answer: "This site has both a frontend and a backend. The frontend is built with Vue.js and TypeScript, while the backend is built with Node.js and TypeScript. The frontend uses Cypress for testing, although I personally prefer Selenium. I like Vue because it gives me a lot of functionality in one package, but I’m not married to it. If another framework is a better fit for a project, I’m happy to use it.",
	},
	{
		number: "02",
		question: "Why PostgreSQL?",
		answer: "The backend uses Jest for testing and Sequelize as the ORM, with PostgreSQL handling the database. I normally prefer MySQL, but PostgreSQL made more sense for this project, particularly because of the AI component.",
	},
	{
		number: "03",
		question: "Why a second backend?",
		answer: "There’s also a second backend written in Python using FastAPI. That handles the AI API and keeps the LLM functionality separate from the main application.",
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
		<div class="landingDots" aria-hidden="true">
			<span style="top: 18%; left: 12%"></span>
			<span style="top: 32%; left: 78%"></span>
			<span style="top: 46%; left: 22%"></span>
			<span style="top: 58%; left: 88%"></span>
			<span style="top: 70%; left: 8%"></span>
			<span style="top: 24%; left: 64%"></span>
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

	<!--
		Deprecated code: the previous home page was a title and six paragraphs.
		<div class="pageTitle">
			<h1>Home</h1>
		</div>
		<div class="pageContent">
			<p>Welcome to the home page.</p>
			...bio paragraphs, now used as the FAQ answers above...
		</div>
	-->
</template>

<style lang="scss" scoped>
.landing {
	position: relative;
	margin: calc(var(--padding) * -1);
	width: calc(100% + (var(--padding) * 2));
	color: var(--body-text);
	overflow: hidden;
}

.landingDots {
	position: absolute;
	inset: 0;
	height: 70vh;
	pointer-events: none;
	span {
		position: absolute;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--headline);
		opacity: 0.45;
	}
}

.landingHero,
.landingProofWrap,
.landingPages,
.landingFaq,
.landingFooter {
	position: relative;
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
	padding-bottom: 72px;
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
