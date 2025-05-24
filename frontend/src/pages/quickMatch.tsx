import { useState } from 'react';
import DestinationInput from 'src/components/QuickMatch/DestinationInput';
import MatchingAnimation from 'src/components/QuickMatch/MatchingAnimation';
import MatchFoundModal from 'src/components/QuickMatch/MatchFoundModal';
import RideSwiper from 'src/components/QuickMatch/RideSwiper';

export default function QuickMatchPage() {
  const [step, setStep] = useState<'input' | 'scanning' | 'match-found' | 'fallback'>('input');
  const [matchData, setMatchData] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);

  const handleDestinationSubmit = (destination: string) => {
    setStep('scanning');
  
    setTimeout(() => {
      const matched = true; // Set this false for fallback
  
      if (matched) {
        setMatchData({
          destination,
          departureTime: '2024-04-10T14:30',
          coPassengers: ['Sakshi Mittal', 'Yash Raj'],
        });
        setStep('match-found');
      } else {
        // Simulate fallback data with 30 min range and 2km logic
        const now = new Date();
        const fallbackRides = [
          {
            id: 'ride1',
            driver: 'Abhay',
            destination: destination,
            departureTime: new Date(now.getTime() + 15 * 60000).toISOString(), // +15 mins
            coPassengers: [],
          },
          {
            id: 'ride2',
            driver: 'Riya',
            destination: destination,
            departureTime: new Date(now.getTime() + 25 * 60000).toISOString(), // +25 mins
            coPassengers: ['Simran'],
          },
          {
            id: 'ride3',
            driver: 'Ankur',
            destination: destination,
            departureTime: new Date(now.getTime() + 5 * 60000).toISOString(), // +5 mins
            coPassengers: ['Rohit', 'Anjali'],
          },
        ];
        setRides(fallbackRides);
        setStep('fallback');
      }
    }, 3000);
  };
  

  return (
    <>
      {step === 'input' && <DestinationInput onSubmit={handleDestinationSubmit} />}
      {step === 'scanning' && <MatchingAnimation />}
      {step === 'match-found' && <MatchFoundModal data={matchData} />}
      {step === 'fallback' && <RideSwiper rides={rides} />}
    </>
  );
}
