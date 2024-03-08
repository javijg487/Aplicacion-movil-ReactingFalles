import { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as geolib from 'geolib';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DatosContext = createContext();

export const DatosProvider = ({ children }) => {
    const [Fallas, setFallas] = useState([]);
    const [FallasInfantil, setFallasInfantil] = useState([]);
    const [combinedData, setCombinedData] = useState([]);  //Se inicializa con un array vacío
    const [Posicion, setPosicion] = useState(null);
    const [Distancia, setDistancia] = useState(null);

    useEffect(() => {
        loadData();
        loadData_Infantiles();
        obtenerPosicion();
    }, []);

    //Si Fallas o FallasInfantil cambian, se actualiza combinedData
    useEffect(() => {
        setCombinedData([...Fallas, ...FallasInfantil]);
    }, [Fallas, FallasInfantil]);

    useEffect(() => {
        if (Posicion) {
            calcularDistancia(Posicion); // Si tienes la posición, calcula la distancia
        }
        requestLocationPermission(); 
    }, [Posicion, combinedData]);

    const obtenerPosicion =  async () => {
        let location = await Location.getCurrentPositionAsync({});
        setPosicion(location);
    }
    const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('No hay permisos de localización')
            return;
        }
    };


    const loadData = () => {
        fetch('https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/falles-fallas/exports/json?lang=es&timezone=Europe%2FBerlin')
            .then((response) => response.json())
            .then((responseJson) => {
                const fallasConTipo = responseJson.map(falla => ({
                    ...falla,
                    tipo: "Mayor",
                    visitado: false,
                    nombre: falla.nombre || "Nombre no disponible",
                    seccion: falla.seccion || "Sección no disponible",
                    fallera: falla.fallera || "Fallera no disponible",
                    presidente: falla.presidente || "Presidente no disponible",
                    artista: falla.artista || "Artista no disponible",
                    lema: falla.lema || "Lema no disponible",
                    boceto: falla.boceto || "https://st2.depositphotos.com/1967477/6346/v/450/depositphotos_63462971-stock-illustration-sad-smiley-emoticon-cartoon.jpg"


                }));

                setFallas(fallasConTipo);
            });
    }


    const loadData_Infantiles = () => {
        fetch(('https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/falles-infantils-fallas-infantiles/exports/json?lang=es&timezone=Europe%2FBerlin'))
            .then((response) => response.json())
            .then((responseJson) => {
                const fallasConTipo = responseJson.map(falla => ({
                    ...falla,
                    tipo: "Infantil",
                    visitado: false,
                    nombre: falla.nombre || "Nombre no disponible",
                    seccion: falla.seccion || "Sección no disponible",
                    fallera: falla.fallera || "Fallera no disponible",
                    presidente: falla.presidente || "Presidente no disponible",
                    artista: falla.artista || "Artista no disponible",
                    lema: falla.lema || "Lema no disponible",
                    boceto: falla.boceto || "https://st2.depositphotos.com/1967477/6346/v/450/depositphotos_63462971-stock-illustration-sad-smiley-emoticon-cartoon.jpg"
                }));
                setFallasInfantil(fallasConTipo);
            });
    }

    const toggleVisited = (falla) => {
        setCombinedData(combinedData.map(item => {
            if (item.objectid == falla.objectid) {
                falla.visitado ? falla.visitado = false : falla.visitado = true;

                return { ...item }
            }

            return item;
        }));
    }

    const FallaVisited = () => {
        return Distancia.filter(falla => falla.visitado === true);
    }

    const calcularDistancia = (location) => {
        if (location && location.coords) {
            const nuevasDistancias = combinedData.map(item => {
                const distancia = geolib.getDistance(
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    { latitude: item.geo_point_2d.lat, longitude: item.geo_point_2d.lon }
                );
                return { ...item, distancia: distancia/1000 };
            });
            setDistancia(nuevasDistancias);
        }
    }
    
    


    return (
        <DatosContext.Provider value={{ combinedData, Fallas, FallasInfantil, toggleVisited, loadData, loadData_Infantiles, setFallas, setFallasInfantil, FallaVisited, Distancia }}>
            {children}
        </DatosContext.Provider>
    );
};
