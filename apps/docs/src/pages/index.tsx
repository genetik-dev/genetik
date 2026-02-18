import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner)}>
      <div className={styles.heroBg}>
        <div className={styles.heroGrid} aria-hidden />
        <div className={styles.heroGradient} aria-hidden />
      </div>
      <div className="container">
        <div className={styles.heroLogo}>
          <img src="/img/dna-logo.svg" alt="" width={56} height={56} />
        </div>
        <Heading as="h1" className={styles.heroTitle}>
          Build and ship structured content
        </Heading>
        <p className={styles.heroSubtitle}>
          {siteConfig.tagline}
        </p>
        <div className={styles.buttons}>
          <Link className={styles.ctaPrimary} to="/docs/intro">
            Get started
          </Link>
          <Link className={styles.ctaSecondary} to="/playground">
            Try playground
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <div className={styles.homeLayout}>
        <HomepageHeader />
        <main>
          <HomepageFeatures />
        </main>
      </div>
    </Layout>
  );
}
