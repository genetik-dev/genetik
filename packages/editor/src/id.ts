import { nanoid } from "nanoid";

/**
 * Generates a unique node id for new content nodes. Uses nanoid.
 * The caller should ensure the id does not already exist in content if required.
 */
export function generateNodeId(): string {
  return nanoid();
}
