import * as schema from "./db/schema";
import { pgGenerate } from "drizzle-dbml-generator"; 

/* * This script generates a DBML schema file from the Drizzle ORM schema. */

const out = "./schema.dbml";
const relational = true;

pgGenerate({ schema, out, relational });

