import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    ScanCommand,
    QueryCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN,
    },
});

const dynamoDb = DynamoDBDocumentClient.from(client);
dynamoDb
export async function getItem<T>(tableName: string, key: Record<string, any>): Promise<T | null> {
    try {
        const params = {
            TableName: tableName,
            Key: key,
        };
        const { Item } = await dynamoDb.send(new GetCommand(params));
        return Item as T || null;
    } catch (error) {
        console.error("Error al obtener item:", error);
        throw error;
    }
}

export async function getByIndex<T>(tableName: string, indexName: string, key: string, val:string): Promise<T | null> {
    try {
        const params = {
            TableName: tableName,  // Nombre de la tabla
            IndexName: indexName,  // Nombre del GSI
            KeyConditionExpression: `${key} = :value`,  // Aquí usamos keyName para la condición
            ExpressionAttributeValues: {
                ":value": val,  // El valor de búsqueda que se pasa como parámetro
            },
        };
        const { Items } = await dynamoDb.send(new QueryCommand(params));
        return Items as T || null;
    } catch (error) {
        console.error("Error al obtener item:", error);
    }
    return null;
}

export async function putItem<T>(tableName: string, item: T): Promise<{ message: string }> {
    try {
        const params = {
            TableName: tableName,
            Item: item,
        };
        await dynamoDb.send(new PutCommand(params));
        return { message: "Item guardado correctamente" };
    } catch (error) {
        console.error("Error al guardar item:", error);
        throw error;
    }
}

export async function updateItem(tableName: string, key: Record<string, any>, updateData: Record<string, any>): Promise<{ message: string }> {
    try {
        const updateExpression = `SET ${Object.keys(updateData).map((k, i) => `#${k} = :val${i}`).join(", ")}`;
        const expressionAttributeNames = Object.keys(updateData).reduce((acc, k) => ({ ...acc, [`#${k}`]: k }), {});
        const expressionAttributeValues = Object.values(updateData).reduce((acc, v, i) => ({ ...acc, [`:val${i}`]: v }), {});

        const params = {
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        };

        await dynamoDb.send(new UpdateCommand(params));
        return { message: "Item actualizado correctamente" };
    } catch (error) {
        console.error("Error al actualizar item:", error);
        throw error;
    }
}

export async function deleteItem(tableName: string, key: Record<string, any>): Promise<{ message: string }> {
    try {
        const params = {
            TableName: tableName,
            Key: key,
        };
        await dynamoDb.send(new DeleteCommand(params));
        return { message: "Item eliminado correctamente" };
    } catch (error) {
        console.error("Error al eliminar item:", error);
        throw error;
    }
}

export async function scanTable<T>(tableName: string): Promise<T[]> {
    try {
        const params = {
            TableName: tableName,
        };
        const { Items } = await dynamoDb.send(new ScanCommand(params));
        return Items as T[] || [];
    } catch (error) {
        console.error("Error al escanear tabla:", error);
        throw error;
    }
}

