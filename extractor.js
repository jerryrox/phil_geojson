import regionsJson from "./0_region/regions.0.01.json";
import fs from "fs";
import path from "path";

const isPrettyPrint = true;
const extractionFolders = {
    region: "extracted_0_region",
    province: "extracted_1_province",
    municity: "extracted_2_municity",
};

async function saveEditedGeoJson(folderName, fileName, geoData) {
    if(!fs.existsSync(folderName))
        fs.mkdirSync(folderName);
    const filePath = path.join(folderName, `${fileName}.json`);
    fs.writeFile(filePath, JSON.stringify(geoData), () => { });
}

async function saveExtractedProperties(folderName, properties) {
    if(!fs.existsSync(folderName))
        fs.mkdirSync(folderName);
    const propertiesPath = path.join(folderName, "properties.json");
    fs.writeFile(propertiesPath, JSON.stringify(properties, undefined, isPrettyPrint ? "  " : undefined), () => { });
}

function getHostedUrl(folderName, fileName) {
    return `https://raw.githubusercontent.com/jerryrox/phil_geojson/master/${folderName}/${fileName}.json`;
}

function extractRegions() {
    const folderName = extractionFolders.region;
    const properties = [];
    let geoJsonFileName = "";

    for (const feature of regionsJson.features) {
        const prop = feature.properties;
        
        const name = prop.ADM1_EN;
        const altName = prop.ADM1ALT1EN ?? "";
        const id = prop.ADM1_PCODE;
        const countryId = prop.ADM0_PCODE;

        feature.properties = {
            id,
            countryId,
        };

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
        properties.push({
            id,
            countryId,
            name,
            altName,
            geojsonUrl: getHostedUrl(folderName, geoJsonFileName),
        });
    }

    saveEditedGeoJson(folderName, geoJsonFileName, regionsJson);
    saveExtractedProperties(folderName, regionsJson, properties);
}

function extractProvinces() {
    const folderName = extractionFolders.province;
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

            feature.properties = {
                id,
                countryId,
                regionId,
            };
    
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
            properties.push({
                id,
                countryId,
                regionId,
                name,
                altName,
                geojsonUrl: getHostedUrl(folderName, geoJsonFileName),
            });
        }

        saveEditedGeoJson(folderName, geoJsonFileName, provincesJson);
    }

    saveExtractedProperties(folderName, properties);
}

function extractMunicities() {
    const folderName = extractionFolders.municity;
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

            feature.properties = {
                id,
                countryId,
                regionId,
                provinceId,
            };
    
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
            properties.push({
                id,
                countryId,
                regionId,
                provinceId,
                name,
                altName,
            });
        }

        saveEditedGeoJson(folderName, municitiesJson.features[0].properties.provinceId, municitiesJson);
    }

    saveExtractedProperties(folderName, properties);
}

extractRegions();
extractProvinces();
extractMunicities();