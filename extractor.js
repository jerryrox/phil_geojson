import regionsJson from "./0_region/regions.0.01.json";
import fs from "fs";
import path from "path";

const isPrettyPrint = false;
const extractionFolders = {
    region: "extracted_0_region",
    province: "extracted_1_province",
    municity: "extracted_2_municity",
};

/**
 * Saves the specified geojson data to the target folder.
 */
async function saveEditedGeoJson(folderName, fileName, geoData) {
    if (!fs.existsSync(folderName))
        fs.mkdirSync(folderName);
    const filePath = path.join(folderName, `${fileName}.json`);
    fs.writeFile(filePath, JSON.stringify(geoData), () => { });
}

/**
 * Saves the specified property object to the target folder.
 */
async function saveExtractedProperties(folderName, properties) {
    if (!fs.existsSync(folderName))
        fs.mkdirSync(folderName);
    const propertiesPath = path.join(folderName, "properties.json");
    fs.writeFile(propertiesPath, JSON.stringify(properties, undefined, isPrettyPrint ? "  " : undefined), () => { });
}

/**
 * Returns the url where the geojson file will be hosted on.
 */
function getHostedUrl(folderName, fileName) {
    return `https://raw.githubusercontent.com/jerryrox/phil_geojson/master/${folderName}/${fileName}.json`;
}

/**
 * Returns the center point from the list of specified coordinates.
 */
function getCenterPoint(coords) {
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

function extractRegions() {
    const properties = [];
    let geoJsonFileName = "";

    for (const feature of regionsJson.features) {
        const prop = feature.properties;

        const name = prop.ADM1_EN;
        const altName = prop.ADM1ALT1EN ?? "";
        const id = prop.ADM1_PCODE;
        const countryId = prop.ADM0_PCODE;
        const center = getCenterPoint(feature.geometry.coordinates);

        if (name === undefined) {
            console.log("Empty name for property", prop);
            continue;
        }
        if (id === undefined) {
            console.log("Empty id for property", prop);
            continue;
        }
        if (countryId === undefined) {
            console.log("Empty countryId for property", prop);
            continue;
        }

        geoJsonFileName = countryId;
        properties.push(feature.properties = {
            id,
            countryId,
            name,
            altName,
            center,
            geojsonUrl: getHostedUrl(extractionFolders.province, id),
        });
    }

    saveEditedGeoJson(extractionFolders.region, geoJsonFileName, regionsJson);
    saveExtractedProperties(extractionFolders.region, properties);
}

function extractProvinces() {
    const dir = "./1_provinces";
    const provinceFiles = fs.readdirSync(dir);
    const properties = [];

    for (const file of provinceFiles) {
        if (!file.endsWith("json")) {
            continue;
        }
        const rawData = fs.readFileSync(path.join(dir, file));
        const provincesJson = JSON.parse(rawData);
        let geoJsonFileName = "";

        for (const feature of provincesJson.features) {
            const prop = feature.properties;

            const name = prop.ADM2_EN;
            const altName = prop.ADM2ALT1EN ?? prop.ADM2ALT2EN ?? "";
            const id = prop.ADM2_PCODE;
            const countryId = prop.ADM0_PCODE;
            const regionId = prop.ADM1_PCODE;
            const center = getCenterPoint(feature.geometry.coordinates);

            if (name === undefined) {
                console.log("Empty name for property", prop);
                continue;
            }
            if (id === undefined) {
                console.log("Empty id for property", prop);
                continue;
            }
            if (countryId === undefined) {
                console.log("Empty countryId for property", prop);
                continue;
            }
            if (regionId === undefined) {
                console.log("Empty regionId for property", prop);
                continue;
            }

            geoJsonFileName = regionId;
            properties.push(feature.properties = {
                id,
                countryId,
                regionId,
                name,
                altName,
                center,
                geojsonUrl: getHostedUrl(extractionFolders.municity, id),
            });
        }

        saveEditedGeoJson(extractionFolders.province, geoJsonFileName, provincesJson);
    }

    saveExtractedProperties(extractionFolders.province, properties);
}

function extractMunicities() {
    const dir = "./2_municities";
    const municityFiles = fs.readdirSync(dir);
    const properties = [];

    for (const file of municityFiles) {
        if (!file.endsWith("json")) {
            continue;
        }
        const rawData = fs.readFileSync(path.join(dir, file));
        const municitiesJson = JSON.parse(rawData);
        let geoJsonFileName = "";

        for (const feature of municitiesJson.features) {
            const prop = feature.properties;

            const name = prop.ADM3_EN;
            const altName = prop.ADM3ALT1EN ?? prop.ADM3ALT2EN ?? "";
            const id = prop.ADM3_PCODE;
            const countryId = prop.ADM0_PCODE;
            const regionId = prop.ADM1_PCODE;
            const provinceId = prop.ADM2_PCODE;
            const center = getCenterPoint(feature.geometry.coordinates);

            if (name === undefined) {
                console.log("Empty name for property", prop);
                continue;
            }
            if (id === undefined) {
                console.log("Empty id for property", prop);
                continue;
            }
            if (countryId === undefined) {
                console.log("Empty countryId for property", prop);
                continue;
            }
            if (regionId === undefined) {
                console.log("Empty regionId for property", prop);
                continue;
            }
            if (provinceId === undefined) {
                console.log("Empty provinceId for property", prop);
                continue;
            }

            geoJsonFileName = provinceId;
            properties.push(feature.properties = {
                id,
                countryId,
                regionId,
                provinceId,
                name,
                altName,
                center,
            });
        }

        saveEditedGeoJson(extractionFolders.municity, geoJsonFileName, municitiesJson);
    }

    saveExtractedProperties(extractionFolders.municity, properties);
}

extractRegions();
extractProvinces();
extractMunicities();
