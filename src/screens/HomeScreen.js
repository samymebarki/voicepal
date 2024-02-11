import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import Voice from '@react-native-community/voice';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { apiCall} from '../api/openAI';
import Features from '../components/features';
import Tts from 'react-native-tts';
import { Icon } from '@rneui/themed';
import {useNavigation} from '@react-navigation/native';


const App = () => {
  const navigation = useNavigation();
  const [textsumm, setTextsumm] = useState('');
  const [text, setText] = useState(false);
  const [result, setResult] = useState('');
  const [recording, setRecording] = useState(false);
  const [summarize, setSummarize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const scrollViewRef = useRef();

  const speechStartHandler = e => {
    console.log('speech start event', e);
  };
  const speechEndHandler = e => {
    setRecording(false);
    console.log('speech stop event', e);
  };
  const speechResultsHandler = e => {
    console.log('speech event: ',e);
    const text = e.value[0];
    setResult(text);
    
  };

  const speechErrorHandler = e=>{
    console.log('speech error: ',e);
  }

  
  const startRecording = async () => {
    setRecording(true);
    Tts.stop(); 
    try {
      await Voice.start('en-GB'); // en-US

    } catch (error) {
      console.log('error', error);
    }
  };
  const stopRecording = async () => {
    
    try {
      await Voice.stop();
      setRecording(false);
      fetchResponse();
    } catch (error) {
      console.log('error', error);
    }
  };
  const clear = () => {
    Tts.stop();
    setSpeaking(false);
    setLoading(false);
    setMessages([]);
    setSummarize(false);
  };
  const summarizebtn = () => {
    setSummarize(true);
  };
  const summarizetext = (textt) => {
    console.log('text', textt);
    console.log(text);
    setText(true);
    fetchSummary(`Please summarize the following text:\n${textt}`);
  };


  const fetchSummary = async (prompt) => {
    if (prompt.trim().length > 0) {
        setLoading(true);
        let newMessages = [...messages];
        newMessages.push({ role: 'user', content: prompt });
        setMessages([...newMessages]);
        updateScrollView();
        console.log('fetching response here is your prompt: ',prompt);
        apiCall(prompt.trim(), newMessages).then(res => {
            console.log('got api data');
            setLoading(false);
            if (res.success) {
                setMessages([...res.data]);
                setResult('');
                updateScrollView();
                startTextToSpeach(res.data[res.data.length - 1]);
            } else {
                Alert.alert('Error', res.msg);
            }
        });
    }
};

  const fetchResponse = async ()=>{
    if(result.trim().length>0){
      setLoading(true);
      let newMessages = [...messages];
      newMessages.push({role: 'user', content: result.trim()});
      setMessages([...newMessages]);

      // scroll to the bottom of the view
      updateScrollView();
      // fetching response from chatGPT with our prompt and old messages
      apiCall(result.trim(), newMessages).then(res=>{
        console.log('got api data');
        setLoading(false);
        if(res.success){
          setMessages([...res.data]);
          setResult('');
          updateScrollView();

          // now play the response to user
          startTextToSpeach(res.data[res.data.length-1]);
          
        }else{
          Alert.alert('Error', res.msg);
        }
        
      })
    }
  }



  const updateScrollView = ()=>{
    setTimeout(()=>{
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    },200)
  }

  const startTextToSpeach = message=>{
    if(!message.content.includes('https')){
      setSpeaking(true);
      // playing response with the voice id and voice speed
      Tts.speak(message.content, {
        iosVoiceId: 'com.apple.ttsbundle.Samantha-compact',
        rate: 0.5,
      });
    }
  }
  

  const stopSpeaking = ()=>{
    Tts.stop();
    setSpeaking(false);
  }

  useEffect(() => {

    // voice handler events
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechResults = speechResultsHandler;
    Voice.onSpeechError = speechErrorHandler;
    
    // text to speech events
    Tts.setDefaultLanguage('en-IE');
    Tts.addEventListener('tts-start', event => console.log('start', event));
    Tts.addEventListener('tts-finish', event => {console.log('finish', event); setSpeaking(false)});
    Tts.addEventListener('tts-cancel', event => console.log('cancel', event));

    
    
    return () => {
      // destroy the voice instance after component unmounts
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);


  return (
    <View className="flex-1 bg-white">
      {/* <StatusBar barStyle="dark-content" /> */}
      <SafeAreaView className="flex-1 flex mx-5">
      
        {/* bot icon */}
        <View className="flex-row justify-center">
        {summarize || messages.length > 0 && (
            <TouchableOpacity onPress={clear} style={{ position: 'absolute', top: 35, left: 0 }}>
                <Image
                    source={require('../../assets/images/back.png')}
                    style={{ height: 25, width: 25 }}
                />
            </TouchableOpacity>
        )}
          <Image  
              source={require('../../assets/images/bot.png')}
              style={{height: hp(15), width: hp(15)}}
          />
        </View>

        
        {/* features || message history */}
        {
  summarize && (
    <>
      
    <View className="space-y-2 flex-1">
      <Text className="text-gray-700 font-semibold ml-1" style={{fontSize: wp(5)}}>Text Summarization</Text>
  
      <View 
        style={{height: hp(50)}} 
        className="bg-neutral-200 rounded-3xl p-4">
          <ScrollView  
            ref={scrollViewRef} 
            bounces={false} 
            className="space-y-4" 
            showsVerticalScrollIndicator={false}
          >
            {
              messages.map((message, index)=>{
                if(message.role=='assistant'){
                  if(message.content.includes('https')){
                    // result is an ai image
                    return (
                      <View key={index} className="flex-row justify-start">
                        <View 
                          className="p-2 flex rounded-2xl bg-emerald-100 rounded-tl-none">
                            <Image  
                              source={{uri: message.content}} 
                              className="rounded-2xl"  
                              resizeMode="contain" 
                              style={{height: wp(60), width: wp(60)}} 
                            />
                        </View>
                      </View>
                    )
                  }else{
                    // chat gpt response
                    return (
                      <View 
                        key={index} style={{width: wp(70)}} 
                        className="bg-emerald-100 p-2 rounded-xl rounded-tl-none">
                        <Text className="text-neutral-800" style={{fontSize: wp(4)}}  >
                          {message.content}
                        </Text>
                      </View>
                    )
                  }
                }else{
                  // user input text
                  return (
                    <View key={index} className="flex-row justify-end">
                      <View 
                        style={{width: wp(70)}} 
                        className="bg-white p-2 rounded-xl rounded-tr-none">
                        <Text style={{fontSize: wp(4)}}  >
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  );
                }
                
              })
            }
          </ScrollView>
      </View>
      <TextInput
        placeholder="Enter text to summarize..."
        multiline
        numberOfLines={4}
        style={{ height: hp(10), borderWidth: 1, borderColor: 'gray', padding: 10,borderRadius: 10}}
        onChangeText={(text) => setTextsumm(text)}
      />
    </View>
    </>
  )
}

        
        {
          messages.length>0 && !summarize ? (
            <View className="space-y-2 flex-1">
              <Text className="text-gray-700 font-semibold ml-1" style={{fontSize: wp(5)}}>Text/Image Generation</Text>
        
              <View 
                style={{height: hp(58)}} 
                className="bg-neutral-200 rounded-3xl p-4">
                  <ScrollView  
                    ref={scrollViewRef} 
                    bounces={false} 
                    className="space-y-4" 
                    showsVerticalScrollIndicator={false}
                  >
                    {
                      messages.map((message, index)=>{
                        if(message.role=='assistant'){
                          if(message.content.includes('https')){
                            // result is an ai image
                            return (
                              <View key={index} className="flex-row justify-start">
                                <View 
                                  className="p-2 flex rounded-2xl bg-emerald-100 rounded-tl-none">
                                    <Image  
                                      source={{uri: message.content}} 
                                      className="rounded-2xl"  
                                      resizeMode="contain" 
                                      style={{height: wp(60), width: wp(60)}} 
                                    />
                                </View>
                              </View>
                              
                              
                            )
                          }else{
                            // chat gpt response
                            return (
                              <View 
                                key={index} style={{width: wp(70)}} 
                                className="bg-emerald-100 p-2 rounded-xl rounded-tl-none">
                                <Text className="text-neutral-800" style={{fontSize: wp(4)}}  >
                                  {message.content}
                                </Text>
                              </View>
                            )
                          }
                        }else{
                          // user input text
                          return (
                            <View key={index} className="flex-row justify-end">
                              <View 
                                style={{width: wp(70)}} 
                                className="bg-white p-2 rounded-xl rounded-tr-none">
                                <Text style={{fontSize: wp(4)}}  >
                                  {message.content}
                                </Text>
                              </View>
                            </View>
                          );
                        }
                        
                        
                      })
                    }
                  </ScrollView>
              </View>
            </View>
          ): (
            !summarize && (
              <ScrollView style={{height: hp(60)}} bounces={false} showsVerticalScrollIndicator={false} className="space-y-4">
                <Text style={{fontSize: wp(6.5)}} className="font-semibold text-gray-700">Features</Text>
                <View className="bg-emerald-200 p-4 rounded-xl space-y-2">
                    <View className="flex-row items-center space-x-1">
                        <Text style={{fontSize: wp(4.8)}} className="font-semibold text-gray-700">Text Generation</Text>
                    </View>
                    
                    <Text style={{fontSize: wp(3.8)}} className="text-gray-700 font-medium">
                        Voice Pal can provide you with instant and knowledgeable responses, assist you with creative ideas on a wide range of topics.
                    </Text>
                    
                </View>
                <View className="bg-purple-200 p-4 rounded-xl space-y-2">
                    <View className="flex-row items-center space-x-1">
                        <Text style={{fontSize: wp(4.8)}} className="font-semibold text-gray-700">Image Generation</Text>
                    </View>
                    
                    <Text style={{fontSize: wp(3.8)}} className="text-gray-700 font-medium">
                    Voice Pal can generate imaginative and diverse images from textual descriptions, expanding the boundaries of visual creativity.
                    </Text>
                </View>
                <View className="bg-cyan-200 p-4 rounded-xl space-y-2">
                    <View className="flex-row items-center space-x-1">
                        <Text style={{fontSize: wp(4.8)}} className="font-semibold text-gray-700">Text Summarization</Text>
                    </View>
                    
                    <Text style={{fontSize: wp(3.8)}} className="text-gray-700 font-medium">
                    Discover concise insights with our intelligent summarization tool, condensing lengthy texts into key points for quick understanding.
                    </Text>
                </View>
              </ScrollView>
            )
          )
        }
        
        
        {/* recording, clear and stop buttons */}
        <View className="flex justify-center items-center relative">
        {
            messages.length==0 && !summarize && (
              <TouchableOpacity 
                onPress={summarizebtn} 
                style={{ position: 'absolute', left: 25, bottom: 20 }}
                className="bg-cyan-400 rounded-3xl p-2 "
              >
                <Text className="text-white font-semibold">Summarize</Text>
              </TouchableOpacity>
            )
          }
          {
            summarize && (
              <TouchableOpacity 
    onPress={() => summarizetext(textsumm)} 
    style={{ position: 'absolute', bottom: 20 }}
    className="bg-purple-400 rounded-2xl p-2"
>
    <Text className="text-white font-semibold">Get Summary</Text>
</TouchableOpacity>
            )
          }
          {
  !summarize && (
    loading ? (
      <Image 
        source={require('../../assets/images/loading.gif')}
        style={{width: hp(10), height: hp(10)}}
      />
    ) : (
      recording ? (
        <TouchableOpacity className="space-y-2" onPress={stopRecording}>
          {/* recording stop button */}
          <Image 
            className={messages.length === 0 ? "rounded-full left-20 sw" : "rounded-full"} 
            source={require('../../assets/images/voiceLoading.gif')}
            style={{width: hp(10), height: hp(10)}}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={startRecording}>
          {/* recording start button */}
          <Image 
            className={messages.length === 0 ? "rounded-full left-20" : "rounded-full"} 
            source={require('../../assets/images/recordingIcon.png')}
            style={{width: hp(10), height: hp(10)}}
          />
        </TouchableOpacity>
      )
    )
  )
}
          
          {
            messages.length>0 && (
              <TouchableOpacity 
                onPress={clear} 
                className="bg-neutral-400 rounded-3xl p-2 absolute right-10"
              >
                <Text className="text-white font-semibold">Clear</Text>
              </TouchableOpacity>
            )
          }
          {
            speaking && (
              <TouchableOpacity 
                onPress={stopSpeaking} 
                className="bg-red-400 rounded-3xl p-2 absolute left-10"
              >
                <Text className="text-white font-semibold">Stop</Text>
              </TouchableOpacity>
            )
          }
            
            
          
        </View>
        
      </SafeAreaView>
    </View>
  );
};

export default App;