// Centralized constants for hub package versions and paths.

/** Version of the hub validator that produced the hub data */
export const VALIDATOR_VERSION = '0.30.0';

/** Version of @shoelace-style/shoelace used in hub snapshots */
export const SHOELACE_VERSION = '2.20.1';

/** Version of @openelement/ui recorded in hub scanner */
export const LESSJS_UI_VERSION = '0.30.0';

/** Path to Shoelace theme CSS inside Deno cache */
export const SHOELACE_THEME_PATH =
  `node_modules/.deno/@shoelace-style+shoelace@${SHOELACE_VERSION}/node_modules/@shoelace-style/shoelace/dist/themes/light.css`;

/** Path to Shoelace component CSS inside Deno cache */
export const SHOELACE_CSS_PATH = (component: string) =>
  `node_modules/.deno/@shoelace-style+shoelace@${SHOELACE_VERSION}/node_modules/@shoelace-style/shoelace/dist/components/${component}/${component}.css`;
