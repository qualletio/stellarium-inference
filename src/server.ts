import "dotenv/config";
import Fastify from "fastify";
import { StellariumNode } from "stellarium-ts";
import { sonnet } from "./claude/sonnet.js";


const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3200;
const baseUrl = process.env.BASE_URL ?? `http://0.0.0.0:${port}`;
const startingPeer = process.env.STARTING_PEER ?? "http://127.0.0.1:3200";

const node = new StellariumNode();
await node.register(sonnet(baseUrl));

const fastify = Fastify({ logger: true });
await node.start(fastify, { port, host: "0.0.0.0", baseUrl, startingPeer });
