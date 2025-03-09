import {Pyme} from "@/modules/pymes/domain/Pyme";
import {PymeRepository} from "@/modules/pymes/domain/PymeRepository";

export async function getPymeByEmail(email: string, pymeRepository: PymeRepository): Promise<Pyme> {
return await pymeRepository.getPymeByEmail(email);
}