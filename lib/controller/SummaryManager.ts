import {
    clearSessionSummaryData,
    clearFileChangeInfoSummaryData,
    getSessionSummaryData,
    saveSessionSummaryToDisk,
    updateStatusBarWithSummaryData
} from "../OfflineManager";
import { getItem } from "../Util";
import { SessionSummary } from "../model/models";
import { PayloadManager } from "./PayloadManager";
import {
    softwareGet,
    isResponseOk,
    serverIsAvailable
} from "../http/HttpClient";
import { commands } from "vscode";

const payloadMgr: PayloadManager = PayloadManager.getInstance();

const moment = require("moment-timezone");

// 5 minutes
const DAY_CHECK_TIMER_INTERVAL = 1000 * 60 * 5;

export class SummaryManager {
    private static instance: SummaryManager;

    private _dayCheckTimer: any = null;
    private _currentDay = null;

    constructor() {
        this.init();
    }

    static getInstance(): SummaryManager {
        if (!SummaryManager.instance) {
            SummaryManager.instance = new SummaryManager();
        }

        return SummaryManager.instance;
    }

    init() {
        // start timer to check if it's a new day or not
        this._dayCheckTimer = setInterval(async () => {
            SummaryManager.getInstance().newDayChecker();
        }, DAY_CHECK_TIMER_INTERVAL);

        this.newDayChecker();
    }

    async newDayChecker() {
        const day = moment().format("YYYY-MM-DD");
        if (day !== this._currentDay) {
            // day does't match.
            // clear the session summary, and the file change info summary data
            clearSessionSummaryData();
            clearFileChangeInfoSummaryData();

            // send the offline data
            await payloadMgr.sendOfflineData();

            // fetch it the api data
            this.getSessionSummaryStatus(true);

            // set the current day
            this._currentDay = day;
        }
    }

    async getSessionSummaryStatus(forceSummaryFetch = false) {
        const jwt = getItem("jwt");
        const serverOnline = await serverIsAvailable();
        let sessionSummaryData: SessionSummary = getSessionSummaryData();
        let status = "OK";

        // if it's online, has a jwt and the requester wants it directly from the API
        if (serverOnline && jwt && forceSummaryFetch) {
            // Returns:
            // data: { averageDailyKeystrokes:982.1339, averageDailyKpm:26, averageDailyMinutes:38,
            // currentDayKeystrokes:8362, currentDayKpm:26, currentDayMinutes:332.99999999999983,
            // currentSessionGoalPercent:0, dailyMinutesGoal:38, inFlow:true, lastUpdatedToday:true,
            // latestPayloadTimestamp:1573050489, liveshareMinutes:null, timePercent:876, velocityPercent:100,
            // volumePercent:851 }
            const result = await softwareGet(`/sessions/summary`, jwt).catch(
                err => {
                    return null;
                }
            );
            if (isResponseOk(result) && result.data) {
                // get the lastStart
                const lastStart = sessionSummaryData.lastStart;
                // update it from the app
                sessionSummaryData = result.data;
                sessionSummaryData.lastStart = lastStart;
                // update the file
                saveSessionSummaryToDisk(sessionSummaryData);
            }
        }

        updateStatusBarWithSummaryData();

        // refresh the tree view
        commands.executeCommand("codetime.refreshKpmTree");

        return { data: sessionSummaryData, status };
    }
}