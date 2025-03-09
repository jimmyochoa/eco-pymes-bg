import {PymeRepository} from "@/modules/pymes/domain/PymeRepository";

export async function login(auth: Auth, pymeRepository: PymeRepository): Promise<any> {
    return pymeRepository.login(auth)
}