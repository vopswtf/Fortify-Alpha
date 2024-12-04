const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../util/middleware");
const ProfileModel = require("../model/profile");
const operations = {};

(async () => {
    for (const operationType of ["client", "dedicated", "public"]) {
        operations[operationType] = {};

        for (const operation of fs.readdirSync(path.join(__dirname, "mcp", operationType))) {
            const operationFile = require(path.join(__dirname, "mcp", operationType, operation));

            if (!operationFile) {
                log.error(`Operation ${operationType}/${operation} is incomplete and will not be loaded.`);
                continue;
            }

            operations[operationType][operationFile.name] = operationFile;
        };
    };
})();

module.exports = (app) => {
    // client operation handler
    app.post("/fortnite/api/game/v2/profile/:accountId/client/:operation", verifyToken, async (req, res) => {
        const profileId = req.query.profileId?.toString();
        if (!profileId) return res.status(400).json({ error: "invalid_profile_id" });

        const operationName = req.params.operation;

        // Handle operations that have implementations
        if (operations.client[operationName]) {
            const operation = operations.client[operationName];
            if (operation.allowedProfiles && !operation.allowedProfiles.includes(profileId)) return res.status(404).json({ error: "operation_not_valid" });

            const profile = await ProfileModel.findOne({ accountId: req.user.accountId, profileId: profileId });
            if (!profile) return res.status(404).json({ error: "profile_id_not_found" });

            req.mcp = { profileChanges: [] };

            const BaseRevision = profile.rvn || 0;
            const QueryRevision = req.query.rvn || -1;

            await operation.handle(req, res, profile);
            if (res.headersSent) {
                console.log(`[MCP] ${operationName} already sent response.`);
                return;
            }
            
            if (QueryRevision !== BaseRevision) {
                req.mcp.profileChanges = [{
                    "changeType": "fullProfileUpdate",
                    "profile": profile
                }];
            }

            return res.json({
                profileRevision: profile.rvn || 0,
                profileId: profile.profileId,
                profileChangesBaseRevision: profile.rvn || 0,
                ...req.mcp,
                profileCommandRevision: profile.commandRevision || 0,
                serverTime: new Date().toISOString(),
                responseVersion: 1
            });
        }
        
        console.log(`[MCP] ${operationName} is not implemented yet.`);
        console.log(req.body);

        return res.status(404).json({ error: "operation_not_valid" });
    });
}

