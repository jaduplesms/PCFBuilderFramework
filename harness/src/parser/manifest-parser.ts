import { XMLParser } from 'fast-xml-parser';
import type { ManifestConfig, ManifestProperty, FeatureUsage, ManifestResources } from '../types/manifest';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['property', 'data-set', 'uses-feature', 'code', 'css', 'platform-library', 'resx'].includes(name),
});

/** Parse a ControlManifest.Input.xml string into a ManifestConfig. */
export function parseManifest(xmlContent: string): ManifestConfig {
  const parsed = parser.parse(xmlContent);
  const control = parsed.manifest.control;

  const properties: ManifestProperty[] = (control.property ?? []).map((p: any) => ({
    name: p['@_name'],
    displayNameKey: p['@_display-name-key'] ?? p['@_name'],
    descriptionKey: p['@_description-key'] ?? '',
    ofType: p['@_of-type'] ?? 'Property',
    ofTypeGroup: p['@_of-type-group'] ?? undefined,
    usage: p['@_usage'] ?? 'bound',
    required: p['@_required'] === 'true',
    defaultValue: p['@_default-value'] ?? undefined,
  }));

  const featureUsage: FeatureUsage[] = [];
  const featureBlock = control['feature-usage'];
  if (featureBlock) {
    const features = featureBlock['uses-feature'] ?? [];
    for (const f of features) {
      featureUsage.push({
        name: f['@_name'],
        required: f['@_required'] === 'true',
      });
    }
  }

  const res = control.resources ?? {};
  const resources: ManifestResources = {
    code: (res.code ?? []).map((c: any) => ({
      path: c['@_path'],
      order: parseInt(c['@_order'] ?? '1', 10),
    })),
    css: (res.css ?? []).map((c: any) => ({
      path: c['@_path'],
      order: parseInt(c['@_order'] ?? '1', 10),
    })),
    platformLibraries: (res['platform-library'] ?? []).map((pl: any) => ({
      name: pl['@_name'],
      version: pl['@_version'],
    })),
  };

  const dataSets = (control['data-set'] ?? []).map((ds: any) => ({
    name: ds['@_name'],
    displayNameKey: ds['@_display-name-key'] ?? ds['@_name'],
  }));

  return {
    namespace: control['@_namespace'],
    constructor: control['@_constructor'],
    version: control['@_version'],
    controlType: (control['@_control-type'] ?? 'standard') as 'standard' | 'virtual',
    displayNameKey: control['@_display-name-key'] ?? control['@_constructor'],
    descriptionKey: control['@_description-key'] ?? '',
    properties,
    dataSets,
    featureUsage,
    resources,
  };
}
