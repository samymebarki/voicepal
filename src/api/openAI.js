import { apiKey } from "../constants";
import axios from 'axios';
const client = axios.create({
    headers: {
        "Authorization": "Bearer "+apiKey,
        "Content-Type": "application/json"
    }
})

const chatgptUrl = 'https://api.openai.com/v1/chat/completions';
const dalleUrl = 'https://api.openai.com/v1/images/generations';

export const apiCall = async (prompt, messages)=>{ 
    
    // // Logic 1 : this will check the prompt from chatgpt if user wants to create an image
    try{
        prompt = prompt.toLowerCase()
        const isArt = prompt.includes('image') || prompt.includes('sketch') || prompt.includes('art') || prompt.includes('picture') || prompt.includes('drawing');
        console.log('prompt: ', prompt);
        if (prompt.startsWith('please summarize the following text:')) {
            console.log('ChatGPT API call');
            return chatgptApiCall(prompt, messages);
        }
         else if (isArt) {
            console.log('DALL-E API call');
            return dalleApiCall(prompt, messages);
        } else {
            console.log('ChatGPT API call');
            return chatgptApiCall(prompt, messages);
        }
    } catch(err) {
        console.log('Error: ', err);
        return { success: false, msg: err.message };
    }
}



const chatgptApiCall = async (prompt, messages)=>{
    try{
        const res = await client.post(chatgptUrl, {
            model: "gpt-3.5-turbo",
            messages
        })

        let answer = res.data?.choices[0]?.message?.content;
        messages.push({role: 'assistant', content: answer.trim()});
        // console.log('got chat response', answer);
        return Promise.resolve({success: true, data: messages}); 

    }catch(err){
        console.log('error: ',err);
        return Promise.resolve({success: false, msg: err.message});
    }
}

const dalleApiCall = async (prompt, messages)=>{
    try{
        const res = await client.post(dalleUrl, {
            prompt,
            n: 1,
            size: "512x512"
        })

        let url = res?.data?.data[0]?.url;
        // console.log('got image url: ',url);
        messages.push({role: 'assistant', content: url});
        return Promise.resolve({success: true, data: messages});

    }catch(err){
        console.log('error: ',err);
        return Promise.resolve({success: false, msg: err.message});
    }
}
