import { api } from "./client";

export async function getTasks(){
    const res = await api.get("/tasks")
    return res.data;
}