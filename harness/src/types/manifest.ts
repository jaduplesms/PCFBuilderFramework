/** Parsed representation of a ControlManifest.Input.xml file. */
export interface ManifestConfig {
  namespace: string;
  constructor: string;
  version: string;
  controlType: 'standard' | 'virtual';
  displayNameKey: string;
  descriptionKey: string;
  properties: ManifestProperty[];
  dataSets: ManifestDataSet[];
  featureUsage: FeatureUsage[];
  resources: ManifestResources;
}

export interface ManifestDataSet {
  name: string;
  displayNameKey: string;
}

export interface ManifestProperty {
  name: string;
  displayNameKey: string;
  descriptionKey: string;
  ofType: string;
  ofTypeGroup?: string;
  usage: 'bound' | 'input' | 'output';
  required: boolean;
  defaultValue?: string;
}

export interface FeatureUsage {
  name: string;
  required: boolean;
}

export interface ManifestResources {
  code: { path: string; order: number }[];
  css: { path: string; order: number }[];
  platformLibraries: { name: string; version: string }[];
}
