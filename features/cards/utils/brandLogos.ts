import { type FC } from 'react';
import { type ImageSourcePropType } from 'react-native';
import { type SvgProps } from 'react-native-svg';

import AcquaESaponeLogo from '@/assets/images/brands/acqua-e-sapone.svg';
import AutogrillLogo from '@/assets/images/brands/autogrill.svg';
import BennetLogo from '@/assets/images/brands/bennet.svg';
import BlukidsLogo from '@/assets/images/brands/blukids.png';
import BricoIoLogo from '@/assets/images/brands/brico-io.svg';
import BricoOkLogo from '@/assets/images/brands/brico-ok.svg';
import BricoferLogo from '@/assets/images/brands/bricofer.svg';
import BurgerKingLogo from '@/assets/images/brands/burger-king.svg';
import CalliopeLogo from '@/assets/images/brands/calliope.svg';
import CalzedoniaLogo from '@/assets/images/brands/calzedonia.svg';
import CamaieuLogo from '@/assets/images/brands/camaieu.svg';
import CarrefourLogo from '@/assets/images/brands/carrefour.svg';
import CodiceFiscaleLogo from '@/assets/images/brands/codice-fiscale.svg';
import CoinLogo from '@/assets/images/brands/coin.png';
import ConadLogo from '@/assets/images/brands/conad.svg';
import CoopLogo from '@/assets/images/brands/coop.svg';
import CraiLogo from '@/assets/images/brands/crai.svg';
import DecathlonLogo from '@/assets/images/brands/decathlon.svg';
import DecoLogo from '@/assets/images/brands/deco.svg';
import DemmaLogo from '@/assets/images/brands/demma.svg';
import DesigualLogo from '@/assets/images/brands/desigual.svg';
import DesparLogo from '@/assets/images/brands/despar.svg';
import DouglasLogo from '@/assets/images/brands/douglas.svg';
import EsselungaLogo from '@/assets/images/brands/esselunga.svg';
import EuronicsLogo from '@/assets/images/brands/euronics.svg';
import EurospinLogo from '@/assets/images/brands/eurospin.svg';
import FamilaLogo from '@/assets/images/brands/famila.svg';
import HmLogo from '@/assets/images/brands/hm.svg';
import IdoLogo from '@/assets/images/brands/ido.svg';
import IkeaLogo from '@/assets/images/brands/ikea.svg';
import IlCentesimoLogo from '@/assets/images/brands/il-centesimo.png';
import IlGiganteLogo from '@/assets/images/brands/il-gigante.svg';
import IntimissimiLogo from '@/assets/images/brands/intimissimi.svg';
import JyskLogo from '@/assets/images/brands/jysk.svg';
import LeroyMerlinLogo from '@/assets/images/brands/leroy-merlin.svg';
import LidlLogo from '@/assets/images/brands/lidl.svg';
import LotteriaDegliScontriniLogo from '@/assets/images/brands/lotteria-degli-scontrini.svg';
import MarionnaudLogo from '@/assets/images/brands/marionnaud.svg';
import MdLogo from '@/assets/images/brands/md.svg';
import MediaworldLogo from '@/assets/images/brands/mediaworld.svg';
import MotiviLogo from '@/assets/images/brands/motivi.svg';
import NaturasiLogo from '@/assets/images/brands/naturasi.svg';
import OldWildWestLogo from '@/assets/images/brands/old-wild-west.svg';
import OltreLogo from '@/assets/images/brands/oltre.svg';
import OriginalMarinesLogo from '@/assets/images/brands/original-marines.svg';
import OvsLogo from '@/assets/images/brands/ovs.svg';
import PaghiPocoLogo from '@/assets/images/brands/paghi-poco.png';
import PamLogo from '@/assets/images/brands/pam.svg';
import PandoraLogo from '@/assets/images/brands/pandora.svg';
import PennyMarketLogo from '@/assets/images/brands/penny-market.svg';
import PiazzaItaliaLogo from '@/assets/images/brands/piazza-italia.svg';
import PittaRossoLogo from '@/assets/images/brands/pitta-rosso.svg';
import PrenatalLogo from '@/assets/images/brands/prenatal.svg';
import Q8Logo from '@/assets/images/brands/q8.svg';
import RinascenteLogo from '@/assets/images/brands/rinascente.svg';
import SephoraLogo from '@/assets/images/brands/sephora.svg';
import SidisLogo from '@/assets/images/brands/sidis.png';
import StroiliLogo from '@/assets/images/brands/stroili.svg';
import SuperConvenienteLogo from '@/assets/images/brands/super-conveniente.svg';
import TamoilLogo from '@/assets/images/brands/tamoil.svg';
import TelepassLogo from '@/assets/images/brands/telepass.svg';
import ThunLogo from '@/assets/images/brands/thun.svg';
import TigotaLogo from '@/assets/images/brands/tigota.svg';
import TommyHilfigerLogo from '@/assets/images/brands/tommy-hilfiger.svg';
import ToysCenterLogo from '@/assets/images/brands/toys-center.svg';
import TrenitaliaLogo from '@/assets/images/brands/trenitalia.svg';
import UciCinemasLogo from '@/assets/images/brands/uci-cinemas.svg';
import UnesLogo from '@/assets/images/brands/unes.svg';
import UniclubLogo from '@/assets/images/brands/uniclub.png';
import UnieuroLogo from '@/assets/images/brands/unieuro.svg';
import UpimLogo from '@/assets/images/brands/upim.png';
import ZaraLogo from '@/assets/images/brands/zara.svg';

/** SVG component or static image source — consumers render via <BrandLogo /> */
export type BrandLogoSource = FC<SvgProps> | ImageSourcePropType;

const BRAND_LOGOS: Record<string, BrandLogoSource> = {
  'acqua-e-sapone': AcquaESaponeLogo,
  autogrill: AutogrillLogo,
  bennet: BennetLogo,
  blukids: BlukidsLogo,
  'brico-io': BricoIoLogo,
  'brico-ok': BricoOkLogo,
  bricofer: BricoferLogo,
  'burger-king': BurgerKingLogo,
  calzedonia: CalzedoniaLogo,
  calliope: CalliopeLogo,
  camaieu: CamaieuLogo,
  carrefour: CarrefourLogo,
  'codice-fiscale': CodiceFiscaleLogo,
  crai: CraiLogo,
  deco: DecoLogo,
  demma: DemmaLogo,
  desigual: DesigualLogo,
  coin: CoinLogo,
  conad: ConadLogo,
  coop: CoopLogo,
  decathlon: DecathlonLogo,
  despar: DesparLogo,
  douglas: DouglasLogo,
  esselunga: EsselungaLogo,
  euronics: EuronicsLogo,
  eurospin: EurospinLogo,
  famila: FamilaLogo,
  hm: HmLogo,
  ikea: IkeaLogo,
  ido: IdoLogo,
  'il-centesimo': IlCentesimoLogo,
  'il-gigante': IlGiganteLogo,
  intimissimi: IntimissimiLogo,
  jysk: JyskLogo,
  'leroy-merlin': LeroyMerlinLogo,
  lidl: LidlLogo,
  'lotteria-degli-scontrini': LotteriaDegliScontriniLogo,
  marionnaud: MarionnaudLogo,
  md: MdLogo,
  mediaworld: MediaworldLogo,
  motivi: MotiviLogo,
  naturasi: NaturasiLogo,
  'old-wild-west': OldWildWestLogo,
  oltre: OltreLogo,
  'original-marines': OriginalMarinesLogo,
  ovs: OvsLogo,
  'paghi-poco': PaghiPocoLogo,
  pam: PamLogo,
  pandora: PandoraLogo,
  'penny-market': PennyMarketLogo,
  'piazza-italia': PiazzaItaliaLogo,
  'pitta-rosso': PittaRossoLogo,
  prenatal: PrenatalLogo,
  q8: Q8Logo,
  rinascente: RinascenteLogo,
  sephora: SephoraLogo,
  sidis: SidisLogo,
  stroili: StroiliLogo,
  'super-conveniente': SuperConvenienteLogo,
  tamoil: TamoilLogo,
  telepass: TelepassLogo,
  thun: ThunLogo,
  tigota: TigotaLogo,
  'tommy-hilfiger': TommyHilfigerLogo,
  'toys-center': ToysCenterLogo,
  trenitalia: TrenitaliaLogo,
  'uci-cinemas': UciCinemasLogo,
  unes: UnesLogo,
  uniclub: UniclubLogo,
  unieuro: UnieuroLogo,
  upim: UpimLogo,
  zara: ZaraLogo
};

export const getBrandLogo = (logoKey: string): BrandLogoSource | undefined => BRAND_LOGOS[logoKey];
