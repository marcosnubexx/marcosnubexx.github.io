import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Carta, Tablero, tableroInicial } from './interface/models';
import { CommonModule, NgClass } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Required for animations
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'cardGame';
  tablero = signal<Tablero>(tableroInicial);
  private toastr = inject(ToastrService)

  /*
    En el motor nos va a hacer falta un método para barajar cartas
  */
  barajarCartas = (cartas: Carta[]): Carta[] => {
    const cartasParaBarajar = cartas;
    let currentIndex = cartasParaBarajar.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [cartasParaBarajar[currentIndex], cartasParaBarajar[randomIndex]] = [
        cartasParaBarajar[randomIndex],
        cartasParaBarajar[currentIndex],
      ];
    }

    return cartasParaBarajar;
  };

  /*
    Una carta se puede voltear si no está encontrada y no está ya volteada, o no hay dos cartas ya volteadas
  */
  sePuedeVoltearLaCarta = (tablero: Tablero, indice: number): boolean => {
    if (tablero.estadoPartida === 'CeroCartasLevantadas') {
      if (tablero.cartas[indice].estaVuelta || tablero.cartas[indice].encontrada) {
        return false;
      }
      return true;
    }

    if (tablero.estadoPartida === 'UnaCartaLevantada') {
      if (tablero.cartas[indice].estaVuelta || tablero.cartas[indice].encontrada) {
        return false;
      }
      return true
    }

    if (tablero.estadoPartida === 'DosCartasLevantadas') {
      return false;
    }

    if (tablero.estadoPartida === 'PartidaNoIniciada') {
      return false;
    }

    return false;
  };

  voltearLaCarta = (tablero: Tablero, indice: number): void => {
    if (!this.sePuedeVoltearLaCarta(tablero, indice)) {
      console.log('bloqueado', { indice, estado: tablero.estadoPartida })
      this.toastr.error('No puedes voltear esta card', 'failed')
      return;
    }

    tablero.cartas[indice].estaVuelta = true;

    switch(tablero.estadoPartida) {
      case 'CeroCartasLevantadas': {
        tablero.estadoPartida = 'UnaCartaLevantada'
        tablero.indiceCartaVolteadaA = indice;
        break;
      }
      case 'UnaCartaLevantada': {
        tablero.estadoPartida = 'DosCartasLevantadas'
        tablero.indiceCartaVolteadaB = indice
        if (this.sonPareja(tablero.indiceCartaVolteadaA!, tablero.indiceCartaVolteadaB, tablero)) {
          this.parejaEncontrada(tablero, tablero.indiceCartaVolteadaA!, tablero.indiceCartaVolteadaB)
        }else {
          setTimeout(() => {
            this.parejaNoEncontrada(tablero, tablero.indiceCartaVolteadaA!, tablero.indiceCartaVolteadaB!)
          }, 1000)
        }
        break;
      }
      case 'DosCartasLevantadas': {
        break;
      }
      default: {
        console.log("hola");
        break;
      }
    }
  };

  /*
    Dos cartas son pareja si en el array de tablero de cada una tienen el mismo id
  */
  sonPareja = (indiceA: number, indiceB: number, tablero: Tablero): boolean => {
    return tablero.cartas[indiceA].idFoto === tablero.cartas[indiceB].idFoto
      ? true
      : false;
  };

  /*
    Aquí asumimos ya que son pareja, lo que hacemos es marcarlas como encontradas y comprobar si la partida esta completa.
  */
  parejaEncontrada = (
    tablero: Tablero,
    indiceA: number,
    indiceB: number,
  ): void => {
    tablero.cartas[indiceA].encontrada = true;
    tablero.cartas[indiceB].encontrada = true;
    tablero.indiceCartaVolteadaA = undefined
    tablero.indiceCartaVolteadaB = undefined
    tablero.estadoPartida = 'CeroCartasLevantadas'
    if (this.esPartidaCompleta(tablero)) {
      tablero.estadoPartida = 'PartidaCompleta'
    }
  };

  /*
    Aquí asumimos que no son pareja y las volvemos a poner boca abajo
  */
  parejaNoEncontrada = (
    tablero: Tablero,
    indiceA: number,
    indiceB: number,
  ): void => {
    tablero.cartas[indiceA].estaVuelta = false;
    tablero.cartas[indiceB].estaVuelta = false;
    tablero.indiceCartaVolteadaA = undefined
    tablero.indiceCartaVolteadaB = undefined
    tablero.estadoPartida = 'CeroCartasLevantadas'
  };

  /*
    Esto lo podemos comprobar o bien utilizando every, o bien utilizando un contador (cartasEncontradas)
  */
  esPartidaCompleta = (tablero: Tablero): boolean => {
    return tablero.cartas.every((carta) => carta.encontrada) ? true : false;
  };

  /*
  Iniciar partida
  */
  iniciaPartida = (tablero: Tablero): void => {
    tablero.cartas = tablero.cartas.map((carta) => {
      carta.estaVuelta = false
      carta.encontrada = false

      return carta
    })
    this.tablero.set({
      cartas: this.barajarCartas(tablero.cartas),
      estadoPartida: 'CeroCartasLevantadas',
    })
  };
}
