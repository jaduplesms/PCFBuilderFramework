"""
Convert Dataverse EntityDefinitions API response to PCF Workbench metadata.json format.

Usage:
  python convert-metadata.py input1.json [input2.json ...] -o metadata.json

Input files should contain the raw JSON response from:
  GET /api/data/v9.2/EntityDefinitions?$filter=LogicalName eq '{entity}'
      &$select=LogicalName,DisplayName
      &$expand=Attributes($select=LogicalName,DisplayName,AttributeType)

You can fetch this from your browser while logged into Dynamics 365,
or use the browser DevTools console script in the README.
"""

import json
import sys
import os

def parse_entity_metadata(raw_json: dict) -> dict:
    """Parse a Dataverse EntityDefinitions API response into our format."""
    result = {}

    entities = raw_json.get('value', [])
    for entity in entities:
        logical_name = entity['LogicalName']
        display_label = entity.get('DisplayName', {}).get('UserLocalizedLabel')
        display_name = display_label['Label'] if display_label else logical_name

        columns = {}
        for attr in entity.get('Attributes', []):
            attr_logical = attr['LogicalName']
            attr_label = attr.get('DisplayName', {}).get('UserLocalizedLabel')
            if not attr_label or not attr_label.get('Label'):
                continue  # Skip internal fields with no display name

            columns[attr_logical] = {
                'displayName': attr_label['Label'],
                'type': attr['AttributeType']
            }

        result[logical_name] = {
            'displayName': display_name,
            'columns': columns
        }

    return result


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    output_file = 'metadata.json'
    input_files = []

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == '-o' and i + 1 < len(args):
            output_file = args[i + 1]
            i += 2
        else:
            input_files.append(args[i])
            i += 1

    if not input_files:
        print("Error: No input files specified")
        sys.exit(1)

    # Load existing metadata if output file exists
    merged = {}
    if os.path.exists(output_file):
        with open(output_file) as f:
            merged = json.load(f)
        print(f"Loaded existing {output_file}: {len(merged)} entities")

    # Parse and merge each input file
    for input_file in input_files:
        print(f"Processing: {input_file}")
        with open(input_file) as f:
            raw = json.load(f)

        parsed = parse_entity_metadata(raw)
        for entity_name, entity_data in parsed.items():
            merged[entity_name] = entity_data
            col_count = len(entity_data['columns'])
            print(f"  {entity_data['displayName']} ({entity_name}): {col_count} columns")

    # Write merged output
    with open(output_file, 'w') as f:
        json.dump(merged, f, indent=2)

    print(f"\nWritten: {output_file} ({len(merged)} entities)")


if __name__ == '__main__':
    main()
