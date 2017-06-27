/* eslint-disable react/no-string-refs */

import React from 'react';
import ReactDOM from 'react-dom';
import tsp from 'teaspoon';

import Transition, { UNMOUNTED, EXITED, ENTERING, ENTERED, EXITING }
  from '../src/Transition';

import { render } from './helpers';

describe('Transition', () => {
  it('should not transition on mount', () => {
    let instance = tsp(
      <Transition
        in
        timeout={0}
        onEnter={()=> { throw new Error('should not Enter'); }}
      >
        <div />
      </Transition>
    )
    .render()

    expect(instance.state('status')).to.equal(ENTERED);
  });

  it('should transition on mount with transitionAppear', done => {
    let instance = tsp(
      <Transition in
        transitionAppear
        timeout={0}
        onEnter={()=> done()}
      >
        <div />
      </Transition>
    )
    .render();

    expect(instance.state('status')).to.equal(EXITED);
  });

  it('should flush new props to the DOM before initiating a transition', function(done) {
    tsp(
      <Transition
        in={false}
        timeout={0}
        enteringClassName='test-entering'
        onEnter={node => {
          expect(node.classList.contains('test-class')).to.equal(true)
          expect(node.classList.contains('test-entering')).to.equal(false)
          done()
        }}
      >
        <div />
      </Transition>
    )
    .render()
    .tap(inst => {
      expect(inst.dom().classList.contains('test-class')).to.equal(false)
    })
    .props({
      in: true,
      className: 'test-class'
    })
  });

  describe('entering', () => {
    let instance;

    beforeEach(() => {
      instance = tsp(
        <Transition
          timeout={10}
          enteredClassName='test-enter'
          enteringClassName='test-entering'
        >
          <div/>
        </Transition>
      )
      .render();
    });

    it('should fire callbacks', done => {
      let onEnter = sinon.spy();
      let onEntering = sinon.spy();

      expect(instance.state('status')).to.equal(EXITED);

      instance.props({
        in: true,

        onEnter,

        onEntering,

        onEntered(){
          expect(onEnter.calledOnce).to.be.ok;
          expect(onEntering.calledOnce).to.be.ok;
          expect(onEnter.calledBefore(onEntering)).to.be.ok;
          done();
        }
      });
    });

    it('should move to each transition state', done => {
      let count = 0;

      expect(instance.state('status')).to.equal(EXITED);

      instance.props({
        in: true,

        onEnter(){
          count++;
          expect(instance.state('status')).to.equal(EXITED);
        },

        onEntering(){
          count++;
          expect(instance.state('status')).to.equal(ENTERING);
        },

        onEntered(){
          expect(instance.state('status')).to.equal(ENTERED);
          expect(count).to.equal(2);
          done();
        }
      });
    });

    it('should apply classes at each transition state', done => {
      let count = 0;

      expect(instance.state('status')).to.equal(EXITED);

      instance.props({
        in: true,

        onEnter(node){
          count++;
          expect(node.className).to.equal('');
        },

        onEntering(node){
          count++;
          expect(node.className).to.equal('test-entering');
        },

        onEntered(node){
          expect(node.className).to.equal('test-enter');
          expect(count).to.equal(2);
          done();
        }
      });
    });
  });

  describe('exiting', ()=> {
    let instance;

    beforeEach(() => {
      instance = tsp(
        <Transition
          in
          timeout={10}
          exitedClassName='test-exit'
          exitingClassName='test-exiting'
        >
          <div/>
        </Transition>
      )
      .render();
    });

    it('should fire callbacks', done => {
      let onExit = sinon.spy();
      let onExiting = sinon.spy();

      expect(instance.state('status')).to.equal(ENTERED);

      instance.props({
        in: false,

        onExit,

        onExiting,

        onExited(){
          expect(onExit.calledOnce).to.be.ok;
          expect(onExiting.calledOnce).to.be.ok;
          expect(onExit.calledBefore(onExiting)).to.be.ok;
          done();
        }
      });
    });

    it('should move to each transition state', done => {
      let count = 0;

      expect(instance.state('status')).to.equal(ENTERED);

      instance.props({
        in: false,

        onExit(){
          count++;
          expect(instance.state('status')).to.equal(ENTERED);
        },

        onExiting(){
          count++;
          expect(instance.state('status')).to.equal(EXITING);
        },

        onExited(){
          expect(instance.state('status')).to.equal(EXITED);
          expect(count).to.equal(2);
          done();
        }
      });
    });

    it('should apply classes at each transition state', done => {
      let count = 0;

      expect(instance.state('status')).to.equal(ENTERED);

      instance.props({
        in: false,

        onExit(node){
          count++;
          expect(node.className).to.equal('');
        },

        onExiting(node){
          count++;
          expect(node.className).to.equal('test-exiting');
        },

        onExited(node){
          expect(node.className).to.equal('test-exit');
          expect(count).to.equal(2);
          done();
        }
      });
    });
  });

  describe('mountOnEnter', () => {
    class MountTransition extends React.Component {
      constructor(props) {
        super(props);
        this.state = {in: props.initialIn};
      }

      render() {
        const { ...props } = this.props;
        delete props.initialIn;

        return (
          <Transition
            ref="transition"
            mountOnEnter
            in={this.state.in}
            timeout={10}
            {...props}
          >
            <div />
          </Transition>
        );
      }

      getStatus = () => {
        // FIXME: This test breaks when using a functional ref.
        return this.refs.transition.state.status;
      }
    }

    it('should mount when entering', done => {
      const instance = tsp(
        <MountTransition
          initialIn={false}
          onEnter={() => {
            expect(instance.unwrap().getStatus()).to.equal(EXITED);
            expect(instance.dom()).to.exist;
            done();
          }}
        />
      )
      .render();

      expect(instance.unwrap().getStatus()).to.equal(UNMOUNTED);

      expect(instance.dom()).to.not.exist;

      instance.props({ in: true });
    });

    it('should stay mounted after exiting', done => {
      const instance = tsp(
        <MountTransition
          initialIn={false}
          onEntered={() => {
            expect(instance.unwrap().getStatus()).to.equal(ENTERED);
            expect(instance.dom()).to.exist;

            instance.state({ in: false });
          }}
          onExited={() => {
            expect(instance.unwrap().getStatus()).to.equal(EXITED);
            expect(instance.dom()).to.exist;

            done();
          }}
        />
      )
      .render();

      expect(instance.dom()).to.not.exist;
      instance.state({ in: true });
    });
  })

  describe('unmountOnExit', () => {
    class UnmountTransition extends React.Component {
      constructor(props) {
        super(props);

        this.state = {in: props.initialIn};
      }

      render() {
        const { ...props } = this.props;
        delete props.initialIn;

        return (
          <Transition
            ref="transition"
            unmountOnExit
            in={this.state.in}
            timeout={10}
            {...props}
          >
            <div />
          </Transition>
        );
      }

      getStatus = () => {
        // FIXME: This test breaks when using a functional ref.
        return this.refs.transition.state.status;
      }
    }

    it('should mount when entering', done => {
      const instance = render(
        <UnmountTransition
          initialIn={false}
          onEnter={() => {
            expect(instance.getStatus()).to.equal(EXITED);
            expect(ReactDOM.findDOMNode(instance)).to.exist;

            done();
          }}
        />
      );

      expect(instance.getStatus()).to.equal(UNMOUNTED);
      expect(ReactDOM.findDOMNode(instance)).to.not.exist;

      instance.setState({in: true});
    });

    it('should unmount after exiting', done => {
      const instance = render(
        <UnmountTransition
          initialIn
          onExited={() => {
            expect(instance.getStatus()).to.equal(UNMOUNTED);
            expect(ReactDOM.findDOMNode(instance)).to.not.exist;

            done();
          }}
        />
      );

      expect(instance.getStatus()).to.equal(ENTERED);
      expect(ReactDOM.findDOMNode(instance)).to.exist;

      instance.setState({in: false});
    });
  });
});
