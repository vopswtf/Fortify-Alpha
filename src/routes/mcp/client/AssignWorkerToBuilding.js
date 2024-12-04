const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "AssignWorkerToBuilding",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);

        const { workerId, buildingId, slotIndex } = req.body;
        if (!buildingId) return res.status(400).json({ error: "missing_parameters" });

        if (isNaN(slotIndex)) return res.status(400).json({ error: "invalid_slot_index" });
        const slotIndexInt = parseInt(slotIndex);

        console.log(`Assigning worker ${workerId} to building ${buildingId} in slot ${slotIndexInt}`);

        const worker = profile.items[workerId];
        const building = profile.items[buildingId];
        let previousWorker;
        if (!building || !building.templateId.startsWith("MyFortBuilding.")) return res.status(400).json({ error: "invalid_worker_or_building" });

        if (slotIndexInt === 0) {
            previousWorker = building.attributes.managerInstanceId;
            profileWrapper.updateAttribute(buildingId, "managerInstanceId", workerId, req.mcp.profileChanges);
        } else {
            const workers = building.attributes.workerInstanceIds || ['', '', '', '', '', ''];
            if (slotIndex > 6) return res.status(400).json({ error: "invalid_slot_index" });
            previousWorker = workers[slotIndex - 1];
            workers[slotIndex - 1] = workerId;

            profileWrapper.updateAttribute(buildingId, "workerInstanceIds", workers, req.mcp.profileChanges);
        }

        const previousWorkerItem = profile.items[previousWorker];
        if (previousWorkerItem) {
            profileWrapper.updateAttribute(previousWorker, "Building_Slot_Used", '', req.mcp.profileChanges);
            profileWrapper.updateAttribute(previousWorker, "Slotted_Building_Id", '', req.mcp.profileChanges);
        }
        
        if (worker) {
            profileWrapper.updateAttribute(workerId, "Slotted_Building_Id", buildingId, req.mcp.profileChanges);
            profileWrapper.updateAttribute(workerId, "Building_Slot_Used", slotIndexInt, req.mcp.profileChanges);
        }

        await profile.save();
    }
};