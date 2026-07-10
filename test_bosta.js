const cities = [{"name":"Alexandria","_id":"Jrb6X6ucjiYgMP4T7"},{"name":"Assuit","_id":"7mDPAohM3ArSZmWTm"},{"name":"Aswan","_id":"kLvZ5JY6LJPL5chzN"},{"name":"Bani Suif","_id":"LzbbvTzZ7D2CgE2PL"},{"name":"Behira","_id":"g3GchTSmCgR2JynsJ"},{"name":"Cairo","_id":"FceDyHXwpSYYF9zGW"},{"name":"Dakahlia","_id":"RrDhS8YYsXAwZ9Zfo"},{"name":"Damietta","_id":"qoZvYcZ8Cqji4pGp5"},{"name":"El Kalioubia","_id":"yp3atroeTwnyiBNKE"},{"name":"Fayoum","_id":"BW5MiNxEirB7tuz2y"},{"name":"Gharbia","_id":"K3RwC677J8kJytdZD"},{"name":"Giza","_id":"0064Qb0OgcA"},{"name":"Ismailia","_id":"PJqNriLtFtx2cfkKP"},{"name":"Kafr Alsheikh","_id":"ByP7rFCjL6XzF6j4S"},{"name":"Luxor","_id":"wgYEdH2WMzxGE2Ztp"},{"name":"Matrouh","_id":"KBpGiRZJMIx"},{"name":"Menya","_id":"si6eLnKjXqTFTMBj9"},{"name":"Monufia","_id":"ruBSjGBDX9wpRa3cc"},{"name":"New Valley","_id":"w4yDVHVJWqa4HpbzA"},{"name":"North Coast","_id":"2hGtNLfRgqGrJjnW9"},{"name":"North Sinai","_id":"ZuCaDAVQlPT"},{"name":"Port Said","_id":"skFtf6ZmKo8kBEBDK"},{"name":"Qena","_id":"vfTHTes3uGjAszgtg"},{"name":"Red Sea","_id":"r5TscLCNSjR2GimxQ"},{"name":"Sharqia","_id":"6ExcoGbpYHnggP8JD"},{"name":"Sohag","_id":"n3EENg2adhuR9xBZK"},{"name":"South Sinai","_id":"nG_c44vHQht"},{"name":"Suez","_id":"PickurJ5uJZ9rDTHW"}];

async function main() {
  const map = {};
  for(const c of cities) {
    try {
      const r = await fetch(`https://app.bosta.co/api/v0/cities/${c._id}/zones`);
      const z = await r.json();
      if(z && z.length > 0) {
        map[c.name] = { cityId: c._id, zoneId: z[0]._id, zoneName: z[0].name };
      }
    } catch(e) {}
  }
  console.log(JSON.stringify(map, null, 2));
}
main();
