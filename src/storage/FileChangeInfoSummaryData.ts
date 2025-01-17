import { getFileDataAsJson, storeJsonData } from "../managers/FileManager";
import { getSoftwareDir, isWindows } from "../Util";

export function getFileChangeSummaryFile() {
  let file = getSoftwareDir();
  if (isWindows()) {
    file += "\\fileChangeSummary.json";
  } else {
    file += "/fileChangeSummary.json";
  }
  return file;
}

export function clearFileChangeInfoSummaryData() {
  saveFileChangeInfoToDisk({});
}

// returns a map of file change info
// {fileName => FileChangeInfo, fileName => FileChangeInfo}
export function getFileChangeSummaryAsJson(): any {
  let fileChangeInfoMap = getFileDataAsJson(getFileChangeSummaryFile());
  if (!fileChangeInfoMap) {
    fileChangeInfoMap = {};
  }
  return fileChangeInfoMap;
}

export function saveFileChangeInfoToDisk(fileChangeInfoData) {
  const file = getFileChangeSummaryFile();
  if (fileChangeInfoData) {
    storeJsonData(file, fileChangeInfoData);
  }
}
