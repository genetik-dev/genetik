import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Playground from "@site/src/components/Playground";

export default function PlaygroundPage(): ReactNode {
  return (
    <Layout
      title="Playground"
      description="Edit JSON content and see it rendered with Genetik."
    >
      <main className="container container--fluid padding-vert--lg">
        <h1>Playground</h1>
        <p>
          Edit the raw content JSON on the left. The preview uses{" "}
          <code>@genetik/renderer-react</code> with a fixed schema: block types{" "}
          <code>text</code> (config: <code>content</code>) and <code>card</code>{" "}
          (config: <code>title</code>, slot: <code>children</code>).
        </p>
        <Playground />
      </main>
    </Layout>
  );
}
