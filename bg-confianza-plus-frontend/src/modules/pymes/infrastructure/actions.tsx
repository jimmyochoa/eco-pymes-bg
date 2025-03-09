"use server";

import {createPyme} from "@/modules/pymes/application/create";
import {dynamoPymeRepository} from "@/modules/pymes/infrastructure/DynamoDBPymeRepository";
import {Pyme} from "@/modules/pymes/domain/Pyme";
import {getPymeByEmail} from "@/modules/pymes/application/getPymeByEmail";

export async function createPymeAction(formData: Pyme): Promise<any> {
    return await createPyme(formData, dynamoPymeRepository());
}

export async function getPymeByEmailAction(email: string): Promise<Pyme> {
    return await getPymeByEmail(email, dynamoPymeRepository());
}