

import { string } from "zod";
import strapi from "./strapi";
import { an } from "node_modules/@faker-js/faker/dist/airline-BXaRegOM";

const getDjQuestions = async () => {
    try {
        const response = await strapi.get('/discovery-jar-questions?filters[answer]&populate=*');
        // query validation = answer should be null & user should not be null
        return response.data.data;
    } catch (error) {
        console.log(error);
    }
}

const getDjAnswers = async () => {
    try {
        const response = await strapi.get('/discovery-jar-answers');
        // fetch list of answers published;
        return response.data.data;
    } catch (error) {
        console.log(error);
    }
}


const ConnectDjQuestionsWithAnswer = async (
    qIds: string[], // questions ids gues here...
    aIds: string, // answer id goes here...
) => {
    try {
        await strapi.put(`/discovery-jar-questions/${aIds}`, {
            answer: {
                connect: qIds
            }
        })
    } catch (error) {
        console.log(error);
    }
}

export { getDjQuestions, getDjAnswers, ConnectDjQuestionsWithAnswer };