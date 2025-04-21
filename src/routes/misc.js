const fs = require('fs');
const path = require('path');

const worldInfo = require('../../common/world_info.json');
const catalog = require('../../common/catalog.json');

module.exports = (app) => {
    app.get('/fortnite/api/game/v2/world/info', (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(worldInfo));
        res.end();
    });

    app.get('/fortnite/api/storefront/v2/catalog', (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(catalog));
        res.end();
    });

    app.get("/fortnite/api/version", (req, res) => {
        res.json({
            app: "fortnite",
            serverDate: new Date().toISOString(),
            overridePropertiesVersion: "unknown",
            cln: "2870186",
            build: "1",
            moduleName: "Fortnite-Core",
            buildDate: "2016-02-17T11:16:51.000Z",
            version: "4.12.0-2870186+++Fortnite+Release-Live",
            branch: "++Fortnite+Release-Live",
            modules: {}
        })
    });

    app.get("/lightswitch/api/service/Fortnite/status", async (req, res) => {
        res.json({
            "serviceInstanceId": "fortnite",
            "status": "UP",
            "message": "Fortnite is online",
            "maintenanceUri": null,
            "overrideCatalogIds": [
                "a7f138b2e51945ffbfdacc1af0541053"
            ],
            "allowedActions": [],
            "banned": false,
            "launcherInfoDTO": {
                "appName": "Fortnite",
                "catalogItemId": "4fe75bbc5a674f4f9b356b5c90567da5",
                "namespace": "fn"
            }
        });
    });
    
    app.get("/lightswitch/api/service/bulk/status", async (req, res) => {
        res.json([{
            "serviceInstanceId": "fortnite",
            "status": "UP",
            "message": "fortnite is up.",
            "maintenanceUri": null,
            "overrideCatalogIds": [
                "a7f138b2e51945ffbfdacc1af0541053"
            ],
            "allowedActions": [
                "PLAY",
                "DOWNLOAD"
            ],
            "banned": false,
            "launcherInfoDTO": {
                "appName": "Fortnite",
                "catalogItemId": "4fe75bbc5a674f4f9b356b5c90567da5",
                "namespace": "fn"
            }
        }]);
    });

    app.get([
        "/account/api/epicdomains/ssodomains",
        "/fortnite/api/game/v2/enabled_features",
        "/account/api/public/account/:accountId/externalAuths",
        "/fortnite/api/game/v2/receipts/:accountId",
    ], (req, res) => {
        res.json([])
    });

    app.get([
        "/catalog/api/shared/bulk/offers",
    ], (req, res) => {
        res.json({})
    });

    app.get("/friends/api/public/list/fortnite/:accountId/recentPlayers", (req, res) => {
        res.json({recentPlayers: {}})
    });

    app.get("/account", (req, res) => {
        res.status(200).end();
    });

    app.get("/fortnite", (req, res) => {
        res.status(200).end();
    });
}