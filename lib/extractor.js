import path from "path";
import fs from "fs";
var __dirname = path.resolve();
var outputFolderName = "extracted";
var outputFolderPath = path.join(__dirname, outputFolderName);
if (!fs.existsSync(outputFolderPath))
    fs.mkdirSync(outputFolderPath);
/**
 * Retries the list of json files from the specified source folder name.
 */
function getJsonFilesFrom(folderName) {
    var files = fs.readdirSync(path.join(__dirname, folderName));
    return files
        .filter(function (f) {
        return f.endsWith("json");
    })
        .map(function (f) {
        return path.join(folderName, f);
    });
}
/**
 * Saves the specified geojson data to the target folder.
 */
function saveGeojson(fileName, geoData) {
    var filePath = path.join(outputFolderPath, "".concat(fileName, ".json"));
    fs.writeFile(filePath, JSON.stringify(geoData), function () { });
}
/**
 * Saves the specified property object to the target folder.
 */
function saveProperties(fileName, properties) {
    var propertiesPath = path.join(outputFolderPath, "".concat(fileName, ".json"));
    fs.writeFile(propertiesPath, JSON.stringify(properties), function () { });
}
/**
 * Returns the url where the geojson file will be hosted on.
 */
function getHostedGeojsonUrl(fileName) {
    return "https://raw.githubusercontent.com/jerryrox/phil_geojson/master/".concat(outputFolderName, "/").concat(fileName, ".json");
}
/**
 * Returns the center point from the list of specified coordinates.
 */
function getCenterPoint(coords) {
    var rightMax = -99999;
    var rightMin = 99999;
    var topMax = -99999;
    var topMin = 99999;
    var path = [coords];
    var inx = 0;
    while (inx < path.length) {
        var node = path[inx++];
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
            path.push.apply(path, node);
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
function extract(files, propFileName, extractProperties, getFeatureGeojsonName, getNewSourceGeojsonName) {
    var allProperties = [];
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var rawData = fs.readFileSync(file);
        var sourceJson = JSON.parse(rawData.toString());
        for (var _a = 0, _b = sourceJson.features; _a < _b.length; _a++) {
            var feature = _b[_a];
            var extractedProps = extractProperties(feature);
            for (var _c = 0, _d = Object.keys(extractedProps); _c < _d.length; _c++) {
                var key = _d[_c];
                if (extractedProps[key] === undefined) {
                    throw new Error("Undefined value for property key: " + key);
                }
            }
            allProperties.push(feature.properties = extractedProps);
            saveGeojson(getFeatureGeojsonName(feature.properties), feature);
        }
        if (getNewSourceGeojsonName !== undefined) {
            saveGeojson(getNewSourceGeojsonName(allProperties), sourceJson);
        }
    }
    saveProperties(propFileName, allProperties);
}
extract(getJsonFilesFrom("0_region"), "_regions_properties", function (feature) {
    var _a;
    var prop = feature.properties;
    var id = prop.ADM1_PCODE;
    var countryId = prop.ADM0_PCODE;
    return {
        id: id,
        countryId: countryId,
        name: prop.ADM1_EN,
        altName: (_a = prop.ADM1ALT1EN) !== null && _a !== void 0 ? _a : "",
        center: getCenterPoint(feature.geometry.coordinates),
        provincesUrl: getHostedGeojsonUrl("provinces_".concat(countryId)),
        geojsonUrl: getHostedGeojsonUrl("region_".concat(id)),
    };
}, function (properties) {
    return "region_".concat(properties.id);
}, function (allProperties) {
    return "provinces_".concat(allProperties[0].countryId);
});
extract(getJsonFilesFrom("1_provinces"), "_provinces_properties", function (feature) {
    var _a, _b;
    var prop = feature.properties;
    var id = prop.ADM2_PCODE;
    var regionId = prop.ADM1_PCODE;
    return {
        name: prop.ADM2_EN,
        altName: (_b = (_a = prop.ADM2ALT1EN) !== null && _a !== void 0 ? _a : prop.ADM2ALT2EN) !== null && _b !== void 0 ? _b : "",
        id: id,
        countryId: prop.ADM0_PCODE,
        regionId: regionId,
        center: getCenterPoint(feature.geometry.coordinates),
        municitiesUrl: getHostedGeojsonUrl("municities_".concat(regionId)),
        geojsonUrl: getHostedGeojsonUrl("province_".concat(id)),
    };
}, function (properties) {
    return "province_".concat(properties.id);
}, function (allProperties) {
    return "municities_".concat(allProperties[0].regionId);
});
extract(getJsonFilesFrom("2_municities"), "_municities_properties", function (feature) {
    var _a, _b;
    var prop = feature.properties;
    var id = prop.ADM3_PCODE;
    var provinceId = prop.ADM2_PCODE;
    return {
        name: prop.ADM3_EN,
        altName: (_b = (_a = prop.ADM3ALT1EN) !== null && _a !== void 0 ? _a : prop.ADM3ALT2EN) !== null && _b !== void 0 ? _b : "",
        id: id,
        countryId: prop.ADM0_PCODE,
        regionId: prop.ADM1_PCODE,
        provinceId: provinceId,
        center: getCenterPoint(feature.geometry.coordinates),
        geojsonUrl: getHostedGeojsonUrl("municity_".concat(id)),
    };
}, function (properties) {
    return "municity_".concat(properties.id);
});
