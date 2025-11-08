declare module "*.png" {
  const value: number;
  export default value;
}

declare module "*.jpg" {
  const value: number;
  export default value;
}

declare module "*.jpeg" {
  const value: number;
  export default value;
}

declare module "*.gif" {
  const value: number;
  export default value;
}

declare module "*.svg" {
  import type { FunctionComponent } from "react";
  import type { SvgProps } from "react-native-svg";
  const content: FunctionComponent<SvgProps>;
  export default content;
}

