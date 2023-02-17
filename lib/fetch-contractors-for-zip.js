import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ 
    projectId: process.env.GCP_PROJECT,
});

console.log('gcp project id', process.env.GCP_PROJECT);

export default async function fetchContractorsForZip(zip) {
    try {
        const doc = await firestore.doc(`calculator-contractors/${zip}`).get();

        if ( !doc.exists ) return null;
        
        const data = doc.data();

        return data;
    } catch ( error ) {
        console.error( error );
        return null;
    }
}
  