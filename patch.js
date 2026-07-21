const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add state variables
content = content.replace(
  '  const [bidAmount, setBidAmount] = useState("");',
  '  const [bidAmount, setBidAmount] = useState("");\n  const [userRegistries, setUserRegistries] = useState<any[]>([]);\n  const [selectedRegistryId, setSelectedRegistryId] = useState<string>("");'
);

// Add fetch registries in onAuthStateChanged
content = content.replace(
  '          setUserRole(\'customer\');\n        }',
  '          setUserRole(\'customer\');\n        }\n        \n        const rq = query(collection(db, "registries"), where("userId", "==", currentUser.uid));\n        const rsnap = await getDocs(rq);\n        const regs: any[] = [];\n        rsnap.forEach(doc => regs.push({ id: doc.id, ...doc.data() }));\n        setUserRegistries(regs);\n        if (regs.length > 0) setSelectedRegistryId(regs[0].id);\n'
);

// clear registries when signed out
content = content.replace(
  '        setUserRole(null);\n      }',
  '        setUserRole(null);\n        setUserRegistries([]);\n      }'
);

// Add addToRegistry function
content = content.replace(
  '  const saveProfile = async (profile: SellerProfile) => {',
  `  const addToRegistry = async (product: Product) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedRegistryId) {
      setSuccessModal({ isOpen: true, message: "Please create a registry first." });
      return;
    }
    
    try {
      // Need arrayUnion which is imported from firestore, so just get the doc, merge arrays. Wait, easier is to import arrayUnion
      // but if not imported, can just do getDoc then update.
      const docRef = doc(db, "registries", selectedRegistryId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data().items || [];
        if (!items.some((i: any) => i.id === product.id)) {
          items.push({ id: product.id, name: product.name, price: product.price });
          await updateDoc(docRef, { items });
          setSuccessModal({ isOpen: true, message: "Added to Registry!" });
        } else {
          setSuccessModal({ isOpen: true, message: "Already in Registry!" });
        }
      }
    } catch (e) {
      setSuccessModal({ isOpen: true, message: "Failed to add to Registry." });
    }
  };

  const saveProfile = async (profile: SellerProfile) => {`
);

// Update UI
content = content.replace(
  '                  </div>\n                </div>\n              </div>\n              \n              <ProductComments',
  \`                  </div>
                  
                  {user && userRegistries.length > 0 && (
                    <div className="flex gap-4 items-center mt-6">
                      <select 
                        value={selectedRegistryId} onChange={e => setSelectedRegistryId(e.target.value)}
                        className="bg-black border border-neutral-800 text-white px-4 py-3 outline-none"
                      >
                        {userRegistries.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <button 
                        onClick={() => addToRegistry(selectedProduct)}
                        className="bg-neutral-800 text-white px-4 py-3 font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors"
                      >
                        Add to Registry
                      </button>
                    </div>
                  )}

                </div>
              </div>
              
              <ProductComments\`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched');
