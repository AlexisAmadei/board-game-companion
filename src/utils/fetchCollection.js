import { getDocs, collection } from 'firebase/firestore';

export default async function fetchCollection(db, collectionName) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => doc.data());
}
