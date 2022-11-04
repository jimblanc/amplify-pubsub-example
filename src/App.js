
import { useState, useCallback, useEffect } from 'react';
import { Amplify, PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub';
import { withAuthenticator, View, Alert, Button, TextField } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
import './App.css';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(awsExports);

const MESSAGE_TOPIC = 'appMessages';

// Configure PubSub with IoT plugin
Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: 'us-east-1',
    aws_pubsub_endpoint: 'wss://a161uwckn3uhtr-ats.iot.us-east-1.amazonaws.com/mqtt'
  })
);

function App() {
  const [ subscription, setSubscription ] = useState();
  const [ latestMessageReceivedTime, setLatestMessageReceivedTime ] = useState('');
  const [ latestMessageReceived, setLatestMessageReceived ] = useState('');
  const [ draftMessage, setDraftMessage ] = useState('');

  // Subscribe to the IoT message topic & setup event handlers
  const subscribe = useCallback(() => {
    console.log(`Subscribing to "${MESSAGE_TOPIC}" topic.`);

    if (!subscription) {
      const newSubscription = PubSub.subscribe(MESSAGE_TOPIC).subscribe({
        next: message => {
          console.log('Message received', message);
  
          setLatestMessageReceived(message.value.msg);
          setLatestMessageReceivedTime(new Date().toISOString());
        },
        error: error => console.error('Error subscribing to topic', error),
        complete: () => console.log('Unsubscribed from topic'),
      });

      setSubscription(newSubscription);
    } else {
      console.log('Existing subscription found, skipping.');
    }
  }, [subscription]);

  // Button callback to unsubscribe from IoT message topic
  const unsubscribe = useCallback(() => {
    console.log(`Unsubscribing to "${MESSAGE_TOPIC}" topic.`);

    if (subscription) {
      subscription.unsubscribe();
      setSubscription(undefined);
    } else {
      console.log('No existing subscriptions found.');
    }
  }, [subscription]);

  // Button callback to publish message to IoT message topic
  const publishMessage = useCallback(() => {
    console.log(`Publishing message to "${MESSAGE_TOPIC}" topic:`, draftMessage);

    PubSub.publish(MESSAGE_TOPIC, { msg: draftMessage })
  }, [draftMessage]);

  useEffect(() => {
    subscribe();
  }, []);

  return (
    <View className='container'>
      { latestMessageReceived && 
        <Alert
          heading="Latest Message Received"
          variation="success"
          marginBottom="medium"
        >
          {latestMessageReceivedTime} - {latestMessageReceived}
        </Alert>
      }

      <TextField
        label='Your message'
        descriptiveText='Message to publish to your IoT backend.'
        maxLength={128} // Max length of messages in IoT
        value={draftMessage}
        onChange={(e) => setDraftMessage(e.target.value)}
      />

      <Button
        variation="primary"
        marginTop="medium"
        onClick={publishMessage}
      >
        Publish Message
      </Button>

      <Button
        marginTop="medium"
        marginLeft="medium"
        onClick={unsubscribe}
      >
        Unsubscribe
      </Button>

      <Button
        marginTop="medium"
        marginLeft="medium"
        onClick={subscribe}
      >
        Resubscribe
      </Button>
    </View>
  );
}

export default withAuthenticator(App);
