import {getByIndex, getItem, putItem} from "@/modules/share/infrastructure/DynamoDBRepository";
import {PymeRepository} from "@/modules/pymes/domain/PymeRepository";
import {Pyme} from "@/modules/pymes/domain/Pyme";

const tableName = "pymes";

export function dynamoPymeRepository(): PymeRepository {
    return {
        createPyme,
        getPymeByEmail
    }
}
const createPyme = async (pymeData: Pyme): Promise<any> => {
    const Item = {
        id: pymeData.id,
        nombreNegocio: pymeData.nombreNegocio ,
        ruc: pymeData.ruc,
        tipoNegocio: pymeData.tipoNegocio ,
        sectorEconomico: pymeData.sectorEconomico ,
        fechaConstitucion: pymeData.fechaConstitucion ,
        nombreRepresentante: pymeData.nombreRepresentante ,
        apellidoRepresentante: pymeData.apellidoRepresentante ,
        identificacionRepresentante: pymeData.identificacionRepresentante ,
        cargoRepresentante: pymeData.cargoRepresentante ,
        direccion: pymeData.direccion ,
        ciudad: pymeData.ciudad ,
        provincia: pymeData.provincia ,
        codigoPostal: pymeData.codigoPostal ,
        telefono:  pymeData.telefono ,
        email: pymeData.email ,
        password: pymeData.password ,
        numeroEmpleados: pymeData.numeroEmpleados ,
        ventasAnuales: pymeData.ventasAnuales ,
        sitioWeb: pymeData.sitioWeb ,
        descripcionNegocio: pymeData.descripcionNegocio ,
        aceptaTerminos: pymeData.aceptaTerminos ,
    };

    return putItem(tableName, Item);
}

const getPymeByEmail = async (email: string): Promise<Pyme | null> => {
    const key = "email";
    const value = email;
    const indexName = "email-index";

    return await getByIndex(tableName, indexName, key, value);

};