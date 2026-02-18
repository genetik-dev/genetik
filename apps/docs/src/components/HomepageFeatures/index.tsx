import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'JSON as source of truth',
    description: (
      <>
        UI structure and configuration live in data, not only in code. A single
        schema defines what&apos;s allowed and drives validation, tooling, and
        rendering everywhere.
      </>
    ),
  },
  {
    title: 'Flat content model',
    description: (
      <>
        Content is a flat map of nodes by id plus one entry id; slots reference
        children by id. No hidden nesting — easy to patch, merge, and reason
        about.
      </>
    ),
  },
  {
    title: 'One content model, many consumers',
    description: (
      <>
        The same content can power CMS editors, LLM-generated UIs, headless APIs,
        and static site generation. Extend with build-time plugins; core stays
        framework-agnostic.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
