"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
let EventsService = class EventsService {
    async emit(tx, eventKey, type, userId, entityId, version, title, href) {
        await tx.outbox.upsert({
            where: { eventKey },
            create: {
                eventKey,
                type,
                userId,
                entityId,
                entityVersion: version,
                payload: { title, href },
            },
            update: {},
        });
    }
    async job(tx, businessKey, type, entityId, userId, runAt) {
        await tx.job.create({
            data: { businessKey, type, entityId, userId, runAt },
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)()
], EventsService);
//# sourceMappingURL=events.service.js.map