const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../util/middleware");
const ProfileModel = require("../model/profile");
const operations = {};

(async () => {
    for (const operationType of ["client", "dedicated", "public"]) {
        operations[operationType] = {};
        
        if (!fs.existsSync(path.join(__dirname, "mcp", operationType))) continue;

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
    app.post("/fortnite/api/game/v2/profile/:accountId/:operationType/:operation", verifyToken, async (req, res) => {
        let operationType = req.params.operationType;
        if (operationType === "dedicated_server") operationType = "dedicated";
        if (!operations[operationType]) return res.status(404).json({ error: "operation_not_valid" });
        if (operationType === "dedicated" && !req.user.isDedicated) return res.status(404).json({ error: "no_access" });

        const profileId = req.query.profileId?.toString();
        if (!profileId) return res.status(400).json({ error: "invalid_profile_id" });

        const operationName = req.params.operation;
        const accountId = operationType === "client" ? req.user.accountId : req.params.accountId;

        // Handle operations that have implementations
        if (operations[operationType][operationName]) {
            const operation = operations[operationType][operationName];
            if (operation.allowedProfiles && !operation.allowedProfiles.includes(profileId)) return res.status(404).json({ error: "operation_not_valid" });

            const profile = await ProfileModel.findOne({ accountId: accountId, profileId: profileId });
            if (!profile) return res.status(404).json({ error: "profile_id_not_found" });

            req.mcp = { profileChanges: [] };
            req.mcpError = (message, status = 400) => res.status(status).json({
                errorCode: "errors.fortify.mcp.operation_failed",
                errorMessage: message,
                messageVars: [],
                numericErrorCode: 0,
                originatingService: "fortify-alpha",
                intent: "prod"
            });

            const BaseRevision = profile.rvn || 0;
            const QueryRevision = req.query.rvn || -1;

            try {
                await operation.handle(req, res, profile);
            } catch (error) {
                console.error(`[MCP] ${operationName} errored:`, error);
                return res.status(500).json({ error: "internal_server_error" });
            }

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
                profileChangesBaseRevision: BaseRevision,
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

