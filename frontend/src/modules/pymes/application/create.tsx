import {Pyme} from "@/modules/pymes/domain/Pyme";
import {PymeRepository} from "@/modules/pymes/domain/PymeRepository";

export async function createPyme(
    pyme: Pyme,
    pymeRepository: PymeRepository,
): Promise<any> {
    return pymeRepository.createPyme(pyme)
}
