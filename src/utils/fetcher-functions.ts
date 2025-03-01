

import strapi from "./strapi";

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


export { getDjQuestions, getDjAnswers };