import { Pyme } from "@/modules/pymes/domain/Pyme";

export interface PymeRepository {
    createPyme(pyme: Pyme): Promise<Pyme>;
    getPymeByEmail(email: string): Promise<Pyme>;
}