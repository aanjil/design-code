/**
 * @niural/emma-avatar (in-repo, package-shaped: React is the only dependency,
 * so this folder can move into niural-fe-pkg as-is).
 *
 * Emma as a living version of her mark - six honeycomb cells round a sparkle
 * that is her face. States with spring-eased poses, blinks, glances, hops
 * and turns, pointer play, reduced motion and a shared frame loop - built
 * around what Emma does in Niural, plus cursor awareness and ambient
 * feedback from the page.
 */
export { EmmaAvatar, EmmaBusContext, type EmmaAvatarHandle, type EmmaAvatarProps } from './emma-avatar'
export { EmmaAmbient, useEmma } from './ambient'
export { EMMA_SHADINGS, MATERIALS, type EmmaShading } from './materials'
export { EmmaBus, globalEmmaBus, type EmmaMoodSource, type EmmaTarget } from './bus'
export {
  EmmaSim,
  EMMA_REACTIONS,
  EMMA_STATES,
  type EmmaPose,
  type EmmaReaction,
  type EmmaState,
} from './sim'
