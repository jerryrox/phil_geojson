import path from "path";
import fs from "fs";

const __dirname = path.resolve();
const outputFolderName = "extracted";
const outputFolderPath = path.join(__dirname, outputFolderName);

if (!fs.existsSync(outputFolderPath))
    fs.mkdirSync(outputFolderPath);

/**
 * Retries the list of json files from the specified source folder name.
 */
function getJsonFilesFrom(folderName: string): string[] {
    const files = fs.readdirSync(path.join(__dirname, folderName));
    return files
        .filter((f) => {
            return f.endsWith("json");
        })
        .map((f) => {
            return path.join(folderName, f);
        });
}

/**
 * Saves the specified geojson data to the target folder.
 */
function saveGeojson(fileName: string, geoData: any) {
    const filePath = path.join(outputFolderPath, `${fileName}.json`);
    fs.writeFile(filePath, JSON.stringify(geoData), () => { });
}

/**
 * Saves the specified property object to the target folder.
 */
function saveProperties(fileName: string, properties: any) {
    const propertiesPath = path.join(outputFolderPath, `${fileName}.json`);
    fs.writeFile(propertiesPath, JSON.stringify(properties), () => { });
}

/**
 * Returns the url where the geojson file will be hosted on.
 */
function getHostedGeojsonUrl(fileName: string): string {
    return `https://raw.githubusercontent.com/jerryrox/phil_geojson/master/${outputFolderName}/${fileName}.json`;
}

/**
 * Returns the center point from the list of specified coordinates.
 */
function getCenterPoint(coords: any[]): number[] {
    var rightMax = -99999;
    var rightMin = 99999;
    var topMax = -99999;
    var topMin = 99999;

    const path = [coords];
    var inx = 0;
    while (inx < path.length) {
        const node = path[inx++];
        if (typeof (node[0]) === "number") {
            // Determine the lng min/max
            if (node[0] > rightMax)
                rightMax = node[0];
            else if (node[0] < rightMin)
                rightMin = node[0];
            // Determine the lat min/max
            if (node[1] > topMax)
                topMax = node[1];
            else if (node[1] < topMin)
                topMin = node[1];
        }
        else {
            // Traverse
            path.push(...node);
        }
    }

    return [
        (rightMax + rightMin) * 0.5,
        (topMax + topMin) * 0.5,
    ];
}

/**
 * Performs a generic extraction logic for the specified input files.
 */
function extract(
    files: string[],
    propFileName: string,
    extractProperties: (feature: any) => any,
    getNewSourceGeojsonName: (allProperties: any) => string,
    getFeatureGeojsonName: (properties: any) => string,
) {
    const allProperties: Record<string, any>[] = [];

    for (const file of files) {
        const rawData = fs.readFileSync(file);
        const sourceJson = JSON.parse(rawData.toString());

        for (const feature of sourceJson.features) {
            const extractedProps = extractProperties(feature);
            for (const key of Object.keys(extractedProps)) {
                if (extractedProps[key] === undefined) {
                    throw new Error("Undefined value for property key: " + key);
                }
            }

            allProperties.push(feature.properties = extractedProps);

            saveGeojson(getFeatureGeojsonName(feature.properties), feature);
        }
        saveGeojson(getNewSourceGeojsonName(allProperties), sourceJson);
    }

    saveProperties(propFileName, allProperties);
}

extract(
    getJsonFilesFrom("0_region"),
    "_regions_properties",
    (feature: any) => {
        const prop = feature.properties;
        const id = prop.ADM1_PCODE;
        const countryId = prop.ADM0_PCODE;
        return {
            id,
            countryId,
            name: prop.ADM1_EN,
            altName: prop.ADM1ALT1EN ?? "",
            center: getCenterPoint(feature.geometry.coordinates),
            regionsUrl: getHostedGeojsonUrl(`regions_${countryId}`),
            geojsonUrl: getHostedGeojsonUrl(`region_${id}`),
        };
    },
    (allProperties: any) => {
        return `regions_${allProperties[0].countryId}`;
    },
    (properties: any) => {
        return `region_${properties.id}`;
    },
);

extract(
    getJsonFilesFrom("1_provinces"),
    "_provinces_properties",
    (feature: any) => {
        const prop = feature.properties;
        const id = prop.ADM2_PCODE;
        const regionId = prop.ADM1_PCODE;
        return {
            name: prop.ADM2_EN,
            altName: prop.ADM2ALT1EN ?? prop.ADM2ALT2EN ?? "",
            id,
            countryId: prop.ADM0_PCODE,
            regionId,
            center: getCenterPoint(feature.geometry.coordinates),
            regionsUrl: getHostedGeojsonUrl(`provinces_${regionId}`),
            geojsonUrl: getHostedGeojsonUrl(`province_${id}`),
        };
    },
    (allProperties: any) => {
        return `provinces_${allProperties[0].regionId}`;
    },
    (properties: any) => {
        return `province_${properties.id}`;
    },
);

extract(
    getJsonFilesFrom("2_municities"),
    "_municities_properties",
    (feature: any) => {
        const prop = feature.properties;
        const id = prop.ADM3_PCODE;
        const provinceId = prop.ADM2_PCODE;
        return {
            name: prop.ADM3_EN,
            altName: prop.ADM3ALT1EN ?? prop.ADM3ALT2EN ?? "",
            id,
            countryId: prop.ADM0_PCODE,
            regionId: prop.ADM1_PCODE,
            provinceId,
            center: getCenterPoint(feature.geometry.coordinates),
            regionsUrl: getHostedGeojsonUrl(`municities_${provinceId}`),
            geojsonUrl: getHostedGeojsonUrl(`municity_${id}`),
        };
    },
    (allProperties: any) => {
        return `municities_${allProperties[0].provinceId}`;
    },
    (properties: any) => {
        return `municity_${properties.id}`;
    },
);